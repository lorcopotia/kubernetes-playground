FROM nginx
COPY index.html /usr/share/nginx/html/
EXPOSE 80
ENV ip_address=$(hostname -I | cut -d' ' -f1)
ENV hostname=$(hostname)
