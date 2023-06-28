# Openshift

OpenShift es una plataforma de contenedores y orquestación de aplicaciones basada en Kubernetes, diseñada para simplificar el desarrollo, implementación y gestión de aplicaciones en entornos de nube y local.

## Métodos de instalación
1. Instalación de OpenShift Container Platform (UPI): Este método implica instalar y configurar manualmente OpenShift en infraestructuras locales o en la nube, siguiendo los pasos detallados en la documentación oficial. Proporciona un mayor control y personalización, pero requiere un conocimiento más profundo de OpenShift y los requisitos de infraestructura.

1. Instalación asistida (IPI): OpenShift ofrece una experiencia de instalación más guiada a través de una herramienta llamada "OpenShift Installer". Esta herramienta simplifica el proceso de instalación, proporcionando una interfaz intuitiva y automatizando muchas de las tareas de configuración. Permite la instalación en infraestructuras locales o en la nube, como AWS, Azure, GCP, etc.

1. Instalación de OpenShift Dedicated: Esta opción es proporcionada directamente por Red Hat y ofrece una instalación y administración totalmente gestionada de OpenShift en la nube. Es ideal para aquellos que prefieren una solución llave en mano y no desean lidiar con la infraestructura y el mantenimiento del clúster.

## Instalación IPI:
Previamente a la instalacion hay informacion es requisito tener la informacion del fichero [install-config.yaml](https://examples.openshift.pub/cluster-installation/vmware/ipi-proxy/#example-install-configyaml) debidamente completada asi como demás requisitos de DNS, DHCP, firewall, etc.

El siguiente ejemplo utiliza vSphere como destino:
```shell
# cat install-config.yaml
apiVersion: v1
baseDomain: openshift.example.com
compute:
- hyperthreading: Enabled
  name: worker
  replicas: 1
  platform:
    vsphere:
      cpus: 4
      memoryMB: 16284
      osDisk:
        diskSizeGB: 120
controlPlane:
  hyperthreading: Enabled
  name: master
  replicas: 3
  platform:
    vsphere:
      cpus: 4
      memoryMB: 16284
      osDisk:
        diskSizeGB: 120
metadata:
  name: NOMBRE_CLUSTER
networking:
  clusterNetwork:
  - cidr: 10.128.0.0/14
    hostPrefix: 23
  machineNetwork:
  - cidr: 192.168.10.0/24
  networkType: OpenShiftSDN
  serviceNetwork:
  - 172.30.0.0/16
platform:
  vsphere:
    vcenter: FQDN_VSPHERE
    username: administrator@vsphere.local
    password: Sup3rS3cr3t!
    datacenter: NOMBRE_DATACENTER
    defaultDatastore: DATASTORE
    folder: RUTA_A_CARPETA
    diskType: thin
    network: NOMBRE_RED
    cluster: NOMBRE_CLUSTER
    apiVIP: 192.168.10.101
    ingressVIP: 192.168.10.102
fips: false
pullSecret: ''
sshKey: ''
```

Descargar el cliente oc y el instalador específico para la versión de Openshift deseada o determinada por la compatibilidad con la versión de vCenter del siguiente [link](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/)

Ejecutar el siguiente comando para lanzar la instalación:
```shell
# Tener en cuenta hacer copia de seguridad del install-config.yaml ya que al momento de despliegue este fichero desaparece
./openshift-install create cluster --dir path/to/install-config --log-level=info
```

Ejecutar el siguiente comando para destruir el cluster:
```shell
./openshift-install destroy cluster --dir path/to/install-config --log-level=info
```
