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
> Ejecutamos el siguiente comando para evitar problemas de ejecucion de comandos de configuracion de nuestro pod
```shell
oc adm policy add-scc-to-user anyuid system:serviceaccount:NAMESPACE_HERE:default
```

1. Desde la terminal, ejecutar el siguiente comando:
```shell
oc new-build https://github.com/lorcopotia/kubernetes-playground.git --context-dir=Labs-openshift/Builds --name=nginx-bc
```
Luego crear un Deployment:
```shell
oc new-app nginx-bc:latest --name=my-nginx-dc
```
Exponemos el servicio:
```shell
oc expose service/my-deploymentconfig
```

2. Otro ejemplo, a partir de la union de los comandos anteriores es el siguiente:
```shell
oc new-app https://github.com/lorcopotia/kubernetes-playground.git --context-dir=Labs-docker/Lab2/node-express-server --name=node-app --as-deployment-config=true
```
Exponemos el puerto de la aplicacion y creamos el servicio
```shell
oc expose dc node-app --port=3080
```
Creamos la ruta para acceder al servicio desde fuera del cluster:
```shell
oc expose svc node-app
```

3. Otra opcion, es utilizar docker en openshift para crear la imagen sin especificar un repositorio:
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
