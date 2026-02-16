 /etc/systemd/system/airmonitor-sensor.service
 
 ## 1. Enable and start
  sudo systemctl daemon-reload -- this is only required when actually changing the .service files
  sudo systemctl enable airmonitor-sensor airmonitor-web
  sudo systemctl start airmonitor-sensor airmonitor-web

  ## 2. Manage
  sudo systemctl stop airmonitor-sensor      # stop
  sudo systemctl restart airmonitor-web      # restart
  sudo systemctl status airmonitor-sensor    # check status
  sudo systemctl status airmonitor-web       # check status
  journalctl -u airmonitor-web -f            # live logs

  ## 3. code changes
  sudo systemctl restart airmonitor-web
  airmonitor-sensor 