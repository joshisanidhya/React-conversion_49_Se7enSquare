fetch("http://localhost:3000/api/users", {
    headers: {
        "x-role": "admin"
    }
})
    .then(response => response.json())
    .then(users => {
        const table = document.getElementById("userTable");
        table.innerHTML = "";

        users.forEach(user => {
            table.innerHTML += `
      <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
      </tr>
    `;
        });
    })
    .catch(error => console.log("Fetch Error:", error));