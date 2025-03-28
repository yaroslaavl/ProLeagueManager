# ProLeagueManager

## Overview
Service for creating and managing leagues and tournaments. Allows users and teams to participate in multiple sports disciplines.

## Features
### User registration and authentication
### User dashboard access
   - Set avatar
   - Change nickname (email cannot be changed)
   - View past matches, joined teams, active and completed tournaments/leagues
   - Create a team
   - Send requests to join a team

 ### Team management
   - Create and manage a team
   - Invite players via an invitation system
   - Accept or reject team invitations
   - Receive and review user requests to join the team
   - Accept or decline user requests
   - Manage team roster (add/remove players)
   - View team notifications in the "Invitations" tab

 ### Competition management
   - Register a team for tournaments/leagues
   - Set minimum required players for a match
   - Automatic captain inclusion in the lineup
   - Select active players and substitutes before a match
   - Generate QR code for team verification in traditional sports    

 ### Event display
   - Categorized events based on ESPORT or SPORT selection
   - Global messages pinned on the main page for important updates
   - Display upcoming tournaments and key matches (semi-finals, finals, top 5 matches)

### Administrator functionalities
  - Create, modify, and delete tournaments, leagues, and teams
  - Add or remove teams from competitions
  - Publish global announcements for matches, tournaments, or leagues
  - Add or remove user roles and user accounts

## Backend Technologies Used
- Java
- Spring (Core, Boot, Data JPA, Security, Cloud), Jakarta Validation (Hibernate Validator)
- Microservices architecture
- Consul
- OpenFeign
- RabbitMQ
- Hibernate
- Redis
- API Gateway
- Flyway
- PostgreSQL
- OAuth 2.0
- MapStruct
- RESTful API
- Maven
- Docker
- MinIo

## Frontend Technologies Used
- HTML
- CSS
- JavaScript

## Database
![image](https://github.com/user-attachments/assets/e924aada-1614-4356-87f8-67cdc1f3849d)

## Configuring Email Settings
To properly configure email settings in your application:

Host: Set host to the SMTP server hostname. Example: smtp.example.com.

Port: Specify the port number used by the SMTP server. Example: 465 for SSL/TLS.

Username: Enter the email address used for authentication on the SMTP server. Example: your-email@example.com.

Password: To generate a 16-digit key for email configuration, follow these steps:

Log in to your Email Service Provider:
Access the website of your email service provider (e.g., Gmail, Yahoo Mail) and log in to your account.

Navigate to API or App Settings:
Find the section related to API access or app settings. Look for options related to generating API keys or app-specific passwords.

Generate New API Key or App Password:
Depending on the provider, select the option to generate a new API key or app password. This key will be used to authenticate your application when sending emails.

Copy and Save the Key:
Once generated, copy the 16-digit key or password provided by the email service provider. Ensure to save it securely as it will not be shown again.

Ensure these settings are correctly configured in application.yml file to enable email functionality in application.

## Configuring OAuth2 for Google Authentication
To configure OAuth2 for Google authentication:
 
Client ID: Set client-id to your Google OAuth2 client ID obtained from the Google Developer Console.
 
Client Secret: Use your client-secret provided by Google when registering your application.
 
Redirect URI: Specify the redirect-uri where Google should redirect users after authentication. Example: http://localhost:8080/login/oauth2/code/google.
 
Scope: Define scope to determine the level of access granted to your application. Common scopes include openid, email, and profile.
 
These settings are essential for enabling Google OAuth2 authentication in your application. Ensure they are correctly configured to facilitate seamless user authentication with Google services.

## How to Get an Azure AI Text API Key
### Sign in to Azure Portal
  - Go to https://portal.azure.com and log in with your Microsoft account.
### Create a Resource
  - Click on "Create a resource" (top-left).
  - Search for either:
    - "Text Analytics" (for Cognitive Services Text API), or
    - "Azure OpenAI" (for Chat, GPT, Completion APIs).
  - Select the service and click "Create".

### Configure the Resource
  - Choose your Subscription and Resource Group.
    - Set a unique Name, select a Region (e.g., East US), and Pricing tier.
    - Click "Review + Create", then "Create".
### Get the API Key and Endpoint
  - After the resource is deployed, go to the resource page.
  - In the left-hand menu, click "Keys and Endpoint".
  - You’ll find:
    - Two API keys (KEY 1 and KEY 2)
    - The Endpoint URL

## Installation
1. Clone the repository:

git clone https://github.com/yaroslaavl/ProLeagueManager.git

 ```

mvn clean install

 ```

### Build Docker images:
 ```

docker-compose build

```

### Start Docker Containers:
 ```

docker-compose up

```

## Consul
Аfter starting the consul container, all configurations must be entered in the Key/Value tab. 

Hierarchy: config -> microservice -> data

The file with configurations is located in the root of the repository

## Our Team
### Backend
Yaroslav Lopatkin - yaroslav.lopatkin.work@gmail.com

Zakhar Taranenko - taranenkozahar@gmail.com
### Frontend
Ivan Petrov - huko2990@gmail.com
### Design
Zhan Karpovich - zhankarpovichpr@gmail.com
