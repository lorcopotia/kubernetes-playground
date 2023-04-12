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
