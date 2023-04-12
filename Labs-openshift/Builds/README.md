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

En el menu de la izquierda dentro de Builds:

BuildConfigs > Create, añadir contextDir para que luzca de esta manera:

```yaml
Codigo
```
