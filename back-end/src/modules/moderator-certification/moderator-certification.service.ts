import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, ModeratorApplicationRecord, ModeratorApplicationStatus, nextId, saveDb } from '../../common/utils/in-memory-db';
import { AppRole } from '../rbac/role.enum';
import { UsersService } from '../users/users.service';

// Doc §12 Certified Moderator System: Apply → Moderation Quiz → Verification → Admin
// Approval → Certified Moderator Badge. Fixed quiz, embedded here (no separate quiz
// content module exists in the doc) — answer key never leaves the server.
const QUIZ = [
  {
    question: 'A player reports another player for using an aimbot. What is the correct first step?',
    options: ['Ban the reported player immediately', 'Review the report and gather evidence before acting', 'Ignore it — anti-cheat is automatic', 'Ask the reporter to record more matches'],
    answerIndex: 1,
  },
  {
    question: 'When should a moderator pause an ongoing match?',
    options: ['Whenever a player asks', 'Only for confirmed rule violations or technical issues', 'Never — matches cannot be paused', 'At the halfway point of every match'],
    answerIndex: 1,
  },
  {
    question: "A tournament rule conflicts with a player's personal request. What governs the decision?",
    options: ["The player's request", 'The moderator\'s personal preference', 'The published tournament rules', 'Whoever complained first'],
    answerIndex: 2,
  },
  {
    question: 'What is required before kicking a player from a match?',
    options: ['A documented, rule-based reason', 'A vote from other players', 'Nothing — moderators have full discretion', 'Organizer sign-off only'],
    answerIndex: 0,
  },
  {
    question: 'How should escalated or serious reports be handled?',
    options: ['Resolved silently by the moderator alone', 'Escalated to System Admin per platform-wide policy', 'Left pending indefinitely', 'Forwarded to the organizer only'],
    answerIndex: 1,
  },
];

const PASSING_SCORE = 70;

@Injectable()
export class ModeratorCertificationService {
  constructor(private readonly usersService: UsersService) {}

  quiz() {
    return QUIZ.map(({ question, options }) => ({ question, options }));
  }

  private findByUserId(userId: number): ModeratorApplicationRecord | undefined {
    const matches = db.moderatorApplications.filter((item) => item.userId === userId);
    return matches[matches.length - 1];
  }

  /** Powers the Admin Dashboard approval queue (doc §12/§19). */
  findAll(status?: ModeratorApplicationStatus) {
    const records = status ? db.moderatorApplications.filter((item) => item.status === status) : db.moderatorApplications;
    return records.map((item) => {
      const user = db.users.find((u) => u.id === item.userId);
      return { ...item, username: user?.username, email: user?.email };
    });
  }

  submitQuiz(userId: number, answers: number[]): ModeratorApplicationRecord {
    const existing = this.findByUserId(userId);
    if (existing && existing.status !== 'rejected') {
      throw new BadRequestException(`User ${userId} already has a ${existing.status} moderator application`);
    }
    if (answers.length !== QUIZ.length) {
      throw new BadRequestException(`Expected ${QUIZ.length} answers, got ${answers.length}`);
    }

    const correct = QUIZ.reduce((count, q, i) => count + (q.answerIndex === answers[i] ? 1 : 0), 0);
    const quizScore = Math.round((correct / QUIZ.length) * 100);

    const created: ModeratorApplicationRecord = {
      id: nextId('moderatorApplication'),
      userId,
      status: quizScore >= PASSING_SCORE ? 'pending' : 'rejected',
      quizScore,
      appliedAt: new Date().toISOString(),
    };
    db.moderatorApplications.push(created);
    saveDb();
    return created;
  }

  setStatus(id: number, status: ModeratorApplicationStatus): ModeratorApplicationRecord {
    const record = db.moderatorApplications.find((item) => item.id === id);
    if (!record) {
      throw new NotFoundException(`Moderator application ${id} not found`);
    }
    record.status = status;
    if (status === 'certified') {
      record.certifiedAt = new Date().toISOString();
      this.usersService.update(record.userId, { role: AppRole.MODERATOR });
    }
    saveDb();
    return record;
  }

  status(userId: number) {
    const record = this.findByUserId(userId);
    return {
      status: record?.status || 'none',
      quizScore: record?.quizScore,
      appliedAt: record?.appliedAt,
      certifiedAt: record?.certifiedAt,
    };
  }
}
