# Notas de Kubernetes/Openshift

# Modificando los parametros de Vim para facilitar la edicion de YAMLs

```yaml
set tabstop=2 softtabstop=2 shiftwidth=2
set expandtab
set number ruler
set autoindent smartindent
syntax enable
filetype plugin indent on

" Force saving files that require root permission 
cnoremap w!! w !sudo tee > /dev/null %
```

# Configurando Kubeconfig:
```shell
kubectl config view # Show Merged kubeconfig settings.
```

## Utilizar multiples kubeconfig al mismo tiempo en una vista conjunta
```shell
KUBECONFIG=~/.kube/config:~/.kube/kubconfig2 

kubectl config view
```

## Obtener password para e2e user
```shell
kubectl config view -o jsonpath='{.users[?(@.name == "e2e")].user.password}'

kubectl config view -o jsonpath='{.users[].name}'    # display the first user
kubectl config view -o jsonpath='{.users[*].name}'   # get a list of users
kubectl config get-contexts                          # display list of contexts 
kubectl config current-context                       # display the current-context
kubectl config use-context my-cluster-name           # set the default context to my-cluster-name
```
## Añadir un nuevo kubeconf que soporta basic auth
```shell
kubectl config set-credentials kubeuser/foo.kubernetes.com --username=kubeuser --password=kubepassword
```
## Utilizar un namespace especifico para todos los siguientes comandos kubectl en el contexto.
```shell
kubectl config set-context --current --namespace=ggckad-s2

## Set a context utilizing a specific username and namespace.
kubectl config set-context gce --user=cluster-admin --namespace=foo && kubectl config use-context gce
 
kubectl config unset users.foo                       # delete user foo
```

## Acceso a la API de Kubernetes
```shell
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $(kubectl get serviceaccount default -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode )
curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
```

## Query a la API de Prometheus para obtener el porciento de ocupación de los PVs
```shell
curl -ks -X GET -H 'Authorization: Bearer $TOKEN' "https://prometheus-k8s-openshift-monitoring.apps.cluster.ocp.local/api/v1/query?query=(kubelet_volume_stats_used_bytes*100)/kubelet_volume_stats_capacity_bytes" | jq  -r '.data.result[] |"\(.metric.persistentvolumeclaim)=\(.value[1])%"'
```

## Para saber que pods usan una imagen determinada:
```shell
kubectl get pods -o json | jq -r '.items[] | select(.metadata.name | test("test-")).spec.containers[].image'
```

# Openshift
## Configuración de openshift-image-registry
En entornos de **Desarrollo** para configurar el almacenamiento de tipo emptyDir (las imágenes se perderán si se reinicia el registry):
```shell
oc patch configs.imageregistry.operator.openshift.io cluster --type merge --patch '{"spec":{"storage":{"emptyDir":{}}}}'
```
Si ejecuta este comando antes de que el Operador de registro de imágenes inicialice sus componentes, el comando oc patch falla con el siguiente error:

```shell
Error from server (NotFound): configs.imageregistry.operator.openshift.io "cluster" not found
```
Espere unos minutos y vuelva a ejecutar el comando.

Para configurar almacenamiento persistente por ejemplo en vSphere ir a la [documentación](https://access.redhat.com/documentation/es-es/openshift_container_platform/4.12/html/registry/setting-up-and-configuring-the-registry#registry-configuring-storage-vsphere_configuring-registry-storage-vsphere).

## Listar imágenes por Pods y Namespace
```shell
oc get pods --all-namespaces -o=jsonpath='{range .items[*]}{"\n"}{.metadata.name}{":\t"}{range .spec.containers[*]}{.image}{", "}{end}{end}' | sort

oc get pods --namespace <namespace> -o jsonpath="{.items[*].spec.containers[*].image}"

 oc import-image image-custom --from=docker.io/lorcopotia/image-custom:latest --confirm
```

# Manejo de usuarios
## Nuevo usuario HTPASSWD
[Enlace](https://docs.openshift.com/container-platform/4.12/authentication/identity_providers/configuring-htpasswd-identity-provider.html) a documentacion oficial.
```shell
htpasswd -c -B -b </path/to/users.htpasswd> <user_name> <password>
htpasswd -c -B -b users.htpasswd ocp-admin Sup3rS3cr3t!
```

## Crear secreto utilizando el fichero anterior como fuente
```shell
oc create secret generic htpass-secret --from-file=htpasswd=users.htpasswd --dry-run=client -o yaml -n openshift-config | oc replace -f -
```

## Verificar el cambio
```shell
oc get secret htpass-secret -ojsonpath={.data.htpasswd} -n openshift-config | base64 --decode
```

## Revisando problemas de inicio de sesión
```shell
oc login api.openshift.example.com:6443 --loglevel=6
```

## Crear cluster role con permisos Reader para el usuario 
```shell
oc create -f discovery_role.yaml
```

```yaml
apiVersion: v1
kind: ClusterRole
metadata:
  namespace: default
  name: discovery_role
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "namespaces", "services", "replicationcontrollers", "persistentvolumes", "persistentvolumeclaims", "resourcequotas", "configmaps", "serviceaccounts"]
  verbs: ["get", "list"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list"]
- apiGroups: ["apps", "extensions"]
  resources: ["replicasets", "deployments", "daemonsets", "statefulsets"]
  verbs: ["get", "list"]
- apiGroups: ["storage.k8s.io"]
  resources: ["storageclasses"]
  verbs: ["get", "list"]
- apiGroups: ["networking.k8s.io", "extensions"]
  resources: ["ingresses"]
  verbs: ["get", "list"]
- apiGroups: ["route.openshift.io"]
  resources: ["routes"]
  verbs: ["get", "list"]
- apiGroups: ["network.openshift.io"]
  resources: ["clusternetworks"]
  verbs: ["get", "list"]
- apiGroups: ["apps.openshift.io"]
  resources: ["deploymentconfigs"]
  verbs: ["get", "list"]
- apiGroups: ["quota.openshift.io"]
  resources: ["clusterresourcequotas"]
  verbs: ["get", "list"]
```

## Otorgar permisos al usuario
```shell
oc adm policy add-cluster-role-to-user discovery_role USUARIO
```

# Administración y gestión del cluster
## Configuracion del perfil del scheduler (distribuidor de pods)
Para utilizar cualquiera de los perfiles de scheduler en Openshift o sea, decirle a Openshift como queremos que distrubuya nuestros pods por el clúster, utilizamos el siguiente comando:
```shell
oc edit scheduler cluster
```

Que luego nos permitirá utilizar uno de los perfiles LowNodeUtilization, HighNodeUtilization, or NoScoring , segun nuestra preferencia, ej:
```yaml
apiVersion: config.openshift.io/v1
kind: Scheduler
metadata:
  ...
  name: cluster
  resourceVersion: "601"
  selfLink: /apis/config.openshift.io/v1/schedulers/cluster
  uid: b351d6d0-d06f-4a99-a26b-87af62e79f59
spec:
  mastersSchedulable: false
  profile: HighNodeUtilization
```


## Openshift upgrade message: Precondition "ClusterVersionUpgradeable" failed
```shell
oc patch clusterversion version --type json -p '[{"op": "remove", "path": "/spec/overrides"}]'
```

