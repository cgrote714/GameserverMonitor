# GameserverMonitor
Use Google Apps Script to monitor your Nitrado Gameserver.
Particularly useful for DAYZ servers.

You can use Google Apps Script to check your server every 5 minutes and restart it if it did not gracefully restart automatically after a DAYZ messages.xml shutdown.
Messages.xml is better than Nitrado Automated Tasks because the server shutdown will match the warning messages players see in the bottom left corner of the screen.
Failed automatic restarts are rare but seem to happen more often when "Reduce log output" is unchecked.

This expands on the work done on https://github.com/cgrote714/GoogleAppsPatreonNotify so read that first.

Requirements:
- A Discord Webhook URL (see GoogleAppsPatreonNotify) for posting the messages in a moderator channel
- A Nitrado API Token from https://server.nitrado.net/developer/tokens (give the token a name and check the Service checkbox)
- You need the Nitrado Server ID of the server(s) you want to monitor.  
This will be a numeric value you see in the link for the Nitrado web interface for your server.  
It also appears in the link for your Nitrado Server's Profile page.

Steps
1. Log in to Google/Gmail
2. Open the Apps Script page (https://script.google.com/home) and create a new project
3. Use the code from Code.gs substituting your Webhook URL, Nitrado API Token and Server ID
4. Save and test the project.  You will be asked by Gmail to authorize the project to "Connect to an external service"
5. Once you have tested it successfully deploy the project as a web app but don't make it public (Only Me)
6. Create a Trigger that runs it every five minutes
