import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { ModeratorApplicationStatus } from '../../common/utils/in-memory-db';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateModeratorStatusDto } from './dto/update-moderator-status.dto';
import { ModeratorCertificationService } from './moderator-certification.service';

@ApiTags('moderator-certification')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. quiz/apply/status: user | organizer | admin. PATCH :id (certify/reject) requires admin only.',
})
@Controller('moderator-certification')
export class ModeratorCertificationController {
  constructor(private readonly moderatorCertificationService: ModeratorCertificationService) {}

  @Get()
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'List all moderator applications', description: 'Admin-only — powers the approval queue.' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'certified', 'rejected'] })
  findAll(@Query('status') status?: ModeratorApplicationStatus) {
    return this.moderatorCertificationService.findAll(status);
  }

  @Get('quiz')
  @Roles(AppRole.USER, AppRole.ORGANIZER, AppRole.COMMUNITY_MANAGER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Get the moderation quiz questions', description: 'Answer key is never returned — score via POST /apply.' })
  quiz() {
    return this.moderatorCertificationService.quiz();
  }

  @Post('apply')
  @Roles(AppRole.USER, AppRole.ORGANIZER, AppRole.COMMUNITY_MANAGER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Submit the moderation quiz to apply for Certified Moderator status', description: 'Scoring ≥70% moves to pending admin review; below 70% is rejected immediately and may be retaken.' })
  @ApiBody({ type: SubmitQuizDto })
  apply(@Body() payload: SubmitQuizDto) {
    return this.moderatorCertificationService.submitQuiz(payload.userId, payload.answers);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Certify or reject a moderator application', description: 'Admin-only. On certification, also flips the applicant\'s account role to moderator.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateModeratorStatusDto })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateModeratorStatusDto) {
    return this.moderatorCertificationService.setStatus(id, payload.status);
  }

  @Get('status')
  @Roles(AppRole.USER, AppRole.ORGANIZER, AppRole.COMMUNITY_MANAGER, AppRole.ADMIN)
  @ApiOperation({ summary: "Get a user's moderator application status" })
  @ApiQuery({ name: 'userId', required: true, example: 4 })
  @ApiOkResponse({ description: 'Application status and quiz score' })
  status(@Query('userId') userId: string) {
    return this.moderatorCertificationService.status(Number(userId));
  }
}
