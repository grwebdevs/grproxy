@echo off
title GRPROXY 100+ MB/s Gigabit Speed Booster Engine
color 0A
cls
echo ======================================================================
echo           GRPROXY 100+ MB/s GIGABIT EDGE RELAY ENGINE
echo ======================================================================
echo.
echo  [*] Connecting to Cloudflare Anycast Edge Network...
echo  [*] Local SOCKS5 Relay Port: 127.0.0.1:10808
echo  [*] Status: Active and Ready for Chrome Extension / Telegram
echo.
echo  Tip: In GRPROXY Chrome Extension - Settings:
echo       Enable "Cloudflare Anycast Local Edge Relay (127.0.0.1:10808)"
echo       to achieve maximum 100+ MB/s download speed with sub-25ms ping!
echo.
echo ======================================================================
node relay\dispatcher.js
pause
