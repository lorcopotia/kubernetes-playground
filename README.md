# Notas de Kubernetes


# Acceso a la API de Kubernetes
```shell
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $(kubectl get serviceaccount default -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode )
curl $APISERVER/api --header "Authorization: Bearer $TOKEN" --insecure
```

## Query a la API de Prometheus para obtener la ocupación de los PVs
```shell
curl -ks -X GET -H 'Authorization: Bearer $TOKEN' "https://prometheus-k8s-openshift-monitoring.apps.openshift46.ocp.local/api/v1/query?query=(kubelet_volume_stats_used_bytes*100)/kubelet_volume_stats_capacity_bytes" | jq  -r '.data.result[] |"\(.metric.persistentvolumeclaim)=\(.value[1])%"'
```
