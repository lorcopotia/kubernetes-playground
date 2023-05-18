# Aplicacion de prueba con nginx

## Docker
Para construir la imagen con Docker, ejecutar el siguiente comando:

```shell
docker build -t mi-servidor-web .
```

Y luego, para utilizarla:

```shell
docker run -p 8080:80 mi-servidor-web
```

## Openshift

Desde la terminal, ejecutar el siguiente comando:
```shell
oc new-build https://github.com/lorcopotia/kubernetes-playground.git --context-dir=Labs-openshift/Builds --name=test-bc
```

Luego crear un Deployment:
```shell
oc new-app test-bc:latest --name=my-deploymentconfig
```

Exponemos el servicio:
```shell
oc expose service/my-deploymentconfig
```

Otra opcion, es utilizar docker en openshift para crear la imagen sin especificar un repositorio:
```shell
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: s2i-build
  namespace: all-testing
spec:
  output:
    to:
      kind: ImageStreamTag
      name: 's2i-build:latest'
  source:
    dockerfile:  |-
      # Pull base image
      FROM debian:latest

      # Install nginx and adjust nginx config to stay in foreground
      RUN apt-get update && apt-get install --no-install-recommends -y nginx; \
       echo "daemon off;" >> /etc/nginx/nginx.conf

      # Expose HTTP
      EXPOSE 80

      # Start nginx
      CMD ["/usr/sbin/nginx"]
  strategy:
    type: Source
    dockerStrategy:
      dockerfilePath: Dockerfile
  triggers:
    - type: ConfigChange
