# Notas de Kubernetes/Openshift

# Making adjustments to Vim for a better yaml editing

```yaml
set tabstop=2 softtabstop=2 shiftwidth=2
set expandtab
set number ruler
set autoindent smartindent
syntax enable
filetype plugin indent on
```

# Setting Up Kubeconfig:

kubectl config view # Show Merged kubeconfig settings.

## Use multiple kubeconfig files at the same time and view merged config
KUBECONFIG=~/.kube/config:~/.kube/kubconfig2 

kubectl config view

## Get the password for the e2e user
```shell
kubectl config view -o jsonpath='{.users[?(@.name == "e2e")].user.password}'

kubectl config view -o jsonpath='{.users[].name}'    # display the first user
kubectl config view -o jsonpath='{.users[*].name}'   # get a list of users
kubectl config get-contexts                          # display list of contexts 
kubectl config current-context                       # display the current-context
kubectl config use-context my-cluster-name           # set the default context to my-cluster-name
```
## Add a new cluster to your kubeconf that supports basic auth
```shell
kubectl config set-credentials kubeuser/foo.kubernetes.com --username=kubeuser --password=kubepassword
```
## Permanently save the namespace for all subsequent kubectl commands in that context.
kubectl config set-context --current --namespace=ggckad-s2

## Set a context utilizing a specific username and namespace.
```shell
kubectl config set-context gce --user=cluster-admin --namespace=foo && kubectl config use-context gce
 
kubectl config unset users.foo                       # delete user foo
```
# Acceso a la API de Kubernetes
```shell
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $(kubectl get serviceaccount default -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode )
curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
```

## Query a la API de Prometheus para obtener el porciento de ocupación de los PVs
```shell
curl -ks -X GET -H 'Authorization: Bearer $TOKEN' "https://prometheus-k8s-openshift-monitoring.apps.openshift46.ocp.local/api/v1/query?query=(kubelet_volume_stats_used_bytes*100)/kubelet_volume_stats_capacity_bytes" | jq  -r '.data.result[] |"\(.metric.persistentvolumeclaim)=\(.value[1])%"'
```

## Para saber que pods usan una imagen determinada:
```shell
kubectl get pods -o json | jq -r '.items[] | select(.metadata.name | test("test-")).spec.containers[].image'
```

## Listar imágenes por Pods y Namespace
```shell
oc get pods --all-namespaces -o=jsonpath='{range .items[*]}{"\n"}{.metadata.name}{":\t"}{range .spec.containers[*]}{.image}{", "}{end}{end}' | sort

oc get pods --namespace <namespace> -o jsonpath="{.items[*].spec.containers[*].image}"
```
