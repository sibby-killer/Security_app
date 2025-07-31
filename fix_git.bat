@echo off
echo Fixing Git repository...

echo Step 1: Remove the large Docker file
if exist DockerDesktopInstaller.exe del DockerDesktopInstaller.exe

echo Step 2: Check Git status
git status

echo Step 3: Add all files except the large one
git add .

echo Step 4: Commit changes
git commit -m "Clean repository without large files"

echo Step 5: Force push to GitHub
git push origin main --force

echo Done! Check your GitHub repository now.
pause 