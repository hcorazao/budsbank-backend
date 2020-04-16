touch ~/.bash_profile
. /home/ec2-user/.nvm/nvm.sh
nvm install node
npm install pm2 -g
cd /app/backend/back/
pm2 delete backend 
pm2 start --name backend index.js
pm2 describe backend
