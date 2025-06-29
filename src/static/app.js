document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Class to manage activities
  class ActivityManager {
    constructor() {
      this.activities = {};
      this.init();
    }

    async init() {
      await this.loadActivities();
      this.setupEventListeners();
      this.renderActivities();
    }

    async loadActivities() {
      try {
        const response = await fetch("/activities");
        this.activities = await response.json();
      } catch (error) {
        console.error("Failed to load activities:", error);
        this.showMessage("Failed to load activities", "error");
      }
    }

    setupEventListeners() {
      // Modal close button
      document.querySelector(".close").addEventListener("click", () => {
        this.closeModal();
      });

      // Modal background click
      document.getElementById("signup-modal").addEventListener("click", (e) => {
        if (e.target.id === "signup-modal") {
          this.closeModal();
        }
      });

      // Signup form submission
      document.getElementById("signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }

    renderActivities() {
      const container = document.getElementById("activities-container");
      container.innerHTML = "";

      Object.entries(this.activities).forEach(([name, activity]) => {
        const card = this.createActivityCard(name, activity);
        container.appendChild(card);
      });
    }

    createActivityCard(name, activity) {
      const card = document.createElement("div");
      card.className = "activity-card";

      const isFull = activity.participants.length >= activity.max_participants;

      const participantsList = activity.participants.length > 0 
        ? `<ul class="participants-list">${activity.participants.map(email => `
            <li>
              <span class="participant-email">${email}</span>
              <button class="delete-participant" onclick="activityManager.unregisterParticipant('${name}', '${email}')" title="Remove participant">
                ×
              </button>
            </li>
          `).join('')}</ul>`
        : '<p class="no-participants">No participants yet - be the first to sign up!</p>';
      
      card.innerHTML = `
          <h3>${name}</h3>
          <p class="description">${activity.description}</p>
          <p class="schedule"><strong>Schedule:</strong> ${activity.schedule}</p>
          <p class="capacity"><strong>Capacity:</strong> ${activity.participants.length}/${activity.max_participants} participants</p>
          
          <div class="participants-section">
              <h4>Current Participants:</h4>
              ${participantsList}
          </div>
          
          <button class="signup-btn" ${isFull ? 'disabled' : ''} 
                  onclick="activityManager.openSignupModal('${name}')">
              ${isFull ? 'Activity Full' : 'Sign Up Now'}
          </button>
      `;

      return card;
    }

    openSignupModal(activityName) {
      document.getElementById("activity-name").value = activityName;
      document.getElementById("email").value = "";
      document.getElementById("signup-modal").style.display = "block";
    }

    closeModal() {
      document.getElementById("signup-modal").style.display = "none";
    }

    async handleSignup() {
      const activityName = document.getElementById("activity-name").value;
      const email = document.getElementById("email").value;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `email=${encodeURIComponent(email)}`,
          }
        );

        if (response.ok) {
          const result = await response.json();
          this.showMessage(result.message, "success");
          this.closeModal();
          await this.loadActivities();
          this.renderActivities();
        } else {
          const error = await response.json();
          this.showMessage(error.detail || "Signup failed", "error");
        }
      } catch (error) {
        console.error("Signup error:", error);
        this.showMessage("Failed to sign up. Please try again.", "error");
      }
    }

    async unregisterParticipant(activityName, email) {
      if (!confirm(`Are you sure you want to unregister ${email} from ${activityName}?`)) {
        return;
      }

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/unregister`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `email=${encodeURIComponent(email)}`,
          }
        );

        if (response.ok) {
          const result = await response.json();
          this.showMessage(result.message, "success");
          await this.loadActivities();
          this.renderActivities();
        } else {
          const error = await response.json();
          this.showMessage(error.detail || "Unregister failed", "error");
        }
      } catch (error) {
        console.error("Unregister error:", error);
        this.showMessage("Failed to unregister. Please try again.", "error");
      }
    }

    showMessage(message, type) {
      // Remove existing messages
      const existingMessages = document.querySelectorAll(
        ".success-message, .error-message"
      );
      existingMessages.forEach((msg) => msg.remove());

      // Create new message
      const messageDiv = document.createElement("div");
      messageDiv.className =
        type === "success" ? "success-message" : "error-message";
      messageDiv.textContent = message;

      // Insert at the top of main
      const main = document.querySelector("main");
      main.insertBefore(messageDiv, main.firstChild);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }
  }

  // Initialize app
  const activityManager = new ActivityManager();
});
