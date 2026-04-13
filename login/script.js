const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Handle form submissions
document.querySelector('.sign-up form').addEventListener('submit', (e) => {
  e.preventDefault();
  const firstName = document.querySelector('input[placeholder="First Name"]').value;
  const lastName = document.querySelector('input[placeholder="Last Name"]').value;
  const email = document.querySelector('input[placeholder="Email"]').value;
  const password = document.querySelector('input[placeholder="Password"]').value;
  const role = document.querySelector('input[name="role"]:checked')?.value;

  if (!firstName || !lastName || !email || !password || !role) {
    alert('Please fill in all fields.');
    return;
  }

  // Simulate account creation
  alert(`Account created for ${firstName} ${lastName} as ${role}.`);
  // Here you would send data to backend
});

document.querySelector('.sign-in form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.querySelector('.sign-in input[placeholder="Email"]').value;
  const password = document.querySelector('.sign-in input[placeholder="Password"]').value;

  if (!email || !password) {
    alert('Please enter email and password.');
    return;
  }

  // Simulate login
  alert('Logged in successfully.');
  // Here you would authenticate
});
