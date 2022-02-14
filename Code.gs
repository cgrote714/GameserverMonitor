function myFunction() {
  //substitute your values these are non-working examples
  const nitrado_token = "u5GNLTEXLHTI-23l4DJv5rUbiplbX4dnwDILbt4Xp4rvWlUL5QVsKJK6bX1YdjtQC3tTu7N26cuD_M9bSIE50D9bhR0VH8L7Wn_q"; 
  const discordUrl = "https://discord.com/api/webhooks/053117534551023489/s7N5fua6csXn_75w8VOkH8lehEaZIGNDw82P0EFZ-wDwxgnhwhvQ2-xtDjUDeQN2TBqi";
  const server_id = 00000000;
  
  checkServer(nitrado_token, server_id, discordUrl); 
  //you can check multiple servers for multiple discords
}

function checkServer(nitrado_token, nitrado_server_id, discordUrl) {
  
  //Nitrado API documentation: https://doc.nitrado.net
  
  try
  {
    const header = {
      "method" : "GET",
      "headers" : {"Authorization": nitrado_token}
    };
    
    const headerp = {
      "method" : "POST",
      "headers" : {"Authorization": nitrado_token}
    };

    //check what the status was last time
    var scriptProperties = PropertiesService.getScriptProperties();
    try
    {
      var laststatus = scriptProperties.getProperty('STATUS_' + nitrado_server_id);
    }
    catch
    {
      scriptProperties.setProperty('STATUS_' + nitrado_server_id, "");
      var laststatus = "";
    }

    //basic Nitrado ping
    var response = UrlFetchApp.fetch("https://api.nitrado.net/ping");
    var healthcheck = JSON.parse(response);
    if (healthcheck.status != "success")
    {
      if (laststatus == "PING") { return; }
      postErrorToDiscord (discordUrl,"Nitrado API not responding", healthcheck.status, healthcheck.message);
      scriptProperties.setProperty('STATUS_' + nitrado_server_id, "PING");
      return;
    }
	
    //Nitrado maintenance check
    var response = UrlFetchApp.fetch("https://api.nitrado.net/maintenance");
    var maintenance = JSON.parse(response);
    if (
      maintenance.status != "success" || 
      maintenance.data.maintenance.cloud_backend != false ||
      maintenance.data.maintenance.domain_backend != false ||
      maintenance.data.maintenance.dns_backend != false ||
      maintenance.data.maintenance.pmacct_backend !=false
      )
    {
      var message = "Backend: ";
      message += maintenance.data.maintenance.cloud_backend ? "Cloud " : "";
      message += maintenance.data.maintenance.domain_backend ? "Domain " : "";
      message += maintenance.data.maintenance.dns_backend ? "DNS " : "";
      message += maintenance.data.maintenance.pmacct_backend ? "PMACCT " : "";
      if (laststatus == message) { return; }
      postErrorToDiscord (discordUrl,"Nitrado Maintenance", maintenance.status, message);
      scriptProperties.setProperty('STATUS_' + nitrado_server_id, message);
      return;
    }

    //find server_id in list of services
    var response = UrlFetchApp.fetch("https://api.nitrado.net/services", header);
    var services = JSON.parse(response);
    
    for(i = 0; i < services.data.services.length; i++)
    {
      if (services.data.services[i].id == nitrado_server_id)
      {
        var response = UrlFetchApp.fetch
          (
            "https://api.nitrado.net/services/" + 
            services.data.services[i].id + 
            "/gameservers", header
          );
        var details = JSON.parse(response);
        var status = details.data.gameserver.status;
        
        if (status == laststatus)
        {
          if (status == "stopped")
          {
            //restart server: https://api.nitrado.net/services/:id/gameservers/restart
            var response = UrlFetchApp.fetch("https://api.nitrado.net/services/" + services.data.services[i].id + "/gameservers/restart", headerp);

            //notify discord moderators that restart was requested
            postMessageToDiscord
              (
                discordUrl,
                0xffff00,
                "Server restart requested",
                services.data.services[i].id, 
                services.data.services[i].details.game, 
                services.data.services[i].details.name, 
                status
              );

            scriptProperties.setProperty('STATUS_' + nitrado_server_id, "restarting");
          }
        }
        else
        {
          //store status in non-volatile memory to check next time script runs
          scriptProperties.setProperty('STATUS_' + nitrado_server_id, status);

          if (status == "started")
          {
            //notify discord moderators that server is running
            postMessageToDiscord
              (
                discordUrl,
                0x00ff00,
                "Server is running",
                services.data.services[i].id, 
                services.data.services[i].details.game, 
                services.data.services[i].details.name, 
                status
              );
            return;
          }

          if (status == "restarting")
          {
            //notify discord moderators that server is restarting
            postMessageToDiscord
              (
                discordUrl,
                0xffff00,
                "Server is restarting",
                services.data.services[i].id, 
                services.data.services[i].details.game, 
                services.data.services[i].details.name, 
                status
              );
            return;
          }

          if (status != "started")
          {
            //notify discord moderators that server is not running
            postMessageToDiscord
              (
                discordUrl,
                0xff0000,
                "Server is not running",
                services.data.services[i].id, 
                services.data.services[i].details.game, 
                services.data.services[i].details.name, 
                status
              );
            return;
          }
            
        }

      }
    }
  }
  catch(e)
  {
    Logger.log("Error:");
    Logger.log(e.message);
    Logger.log(e.stack);
  }

  function postMessageToDiscord(discordUrl, color, description, id, game, name, status) {
    var payload = JSON.stringify({
      "embeds": [{
        "color": color,
        "title": "Nitrado Server Alert",
        "url": "https://server.nitrado.net/",
        "description": description,
        "fields" : [
            {
              name: "Server Name",
              value: name,
            },
            {
              name: "Status",
              value: status,
              inline: true,
            },
            {
              name: 'Server ID',
              value: id,
              inline: true,
            },
            {
              name: "Game Type",
              value: game,
              inline: true
            }
          ],
          "footer" : {"text": new Date().toString()}
      }]
      });
    
    var params = {
      method: 'POST',
      payload: payload,
      muteHttpExceptions: true,
      contentType: "application/json"
    };
    var response = UrlFetchApp.fetch(discordUrl, params);
    
  }

function postErrorToDiscord(discordUrl,description, status, message) {
    var payload = JSON.stringify({
      "embeds": [{
        "color": 0xff0000,
        "title": "Nitrado Server Alert",
        "url": "https://server.nitrado.net/",
        "description": description,
        "fields" : [
            {
              name: "Status",
              value: name,
            },
            {
              name: "Details",
              value: status,
              inline: false
            }
          ],
          "footer" : {"text": new Date().toString()}
      }]
      });
    
    var params = {
      method: 'POST',
      payload: payload,
      muteHttpExceptions: true,
      contentType: "application/json"
    };
    var response = UrlFetchApp.fetch(discordUrl, params);
    
  }
}
