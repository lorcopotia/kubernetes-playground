# Creando soluciones CI/CD para aplicaciones usando Openshift Pipelines

## Prerequisitos
- You have access to an OpenShift Container Platform cluster.
- You have installed OpenShift Pipelines using the Red Hat OpenShift Pipelines Operator listed in the OpenShift OperatorHub. After it is installed, it is applicable to the entire cluster.
- You have installed OpenShift Pipelines CLI.
- You have forked the front-end pipelines-vote-ui and back-end pipelines-vote-api Git repositories using your GitHub ID, and have administrator access to these repositories.
- Optional: You have cloned the pipelines-tutorial Git repository.

## Crear un projecto para la aplicacion
```shell
oc new-project pipelines-tutorial
```

## Asegurarse que la service account tiene permisos suficientes
```shell
oc get serviceaccount pipeline
```

## Creando las pipeline tasks
```shell
oc create -f https://raw.githubusercontent.com/openshift/pipelines-tutorial/pipelines-1.5/01_pipeline/01_apply_manifest_task.yaml
oc create -f https://raw.githubusercontent.com/openshift/pipelines-tutorial/pipelines-1.5/01_pipeline/02_update_deployment_task.yaml
```

## Verificar que se han creado las tasks
```shell
tkn task list
```

Salida:
```shell
NAME                DESCRIPTION   AGE
apply-manifests                   1 minute ago
update-deployment                 48 seconds ago
```

## Crear una task
Copiar y crear un yaml con el siguiente contenido:
```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: build-and-deploy
spec:
  workspaces:
  - name: shared-workspace
  params:
  - name: deployment-name
    type: string
    description: name of the deployment to be patched
  - name: git-url
    type: string
    description: url of the git repo for the code of deployment
  - name: git-revision
    type: string
    description: revision to be used from repo of the code for deployment
    default: "pipelines-1.9"
  - name: IMAGE
    type: string
    description: image to be built from the code
  tasks:
  - name: fetch-repository
    taskRef:
      name: git-clone
      kind: ClusterTask
    workspaces:
    - name: output
      workspace: shared-workspace
    params:
    - name: url
      value: $(params.git-url)
    - name: subdirectory
      value: ""
    - name: deleteExisting
      value: "true"
    - name: revision
      value: $(params.git-revision)
  - name: build-image
    taskRef:
      name: buildah
      kind: ClusterTask
    params:
    - name: IMAGE
      value: $(params.IMAGE)
    workspaces:
    - name: source
      workspace: shared-workspace
    runAfter:
    - fetch-repository
  - name: apply-manifests
    taskRef:
      name: apply-manifests
    workspaces:
    - name: source
      workspace: shared-workspace
    runAfter:
    - build-image
  - name: update-deployment
    taskRef:
      name: update-deployment
    params:
    - name: deployment
      value: $(params.deployment-name)
    - name: IMAGE
      value: $(params.IMAGE)
    runAfter:
    - apply-manifests
```

Aplicar con el siguiente comando:
```shell
oc create -f <pipeline-yaml-file-name.yaml>

# O con el siguiente:
oc create -f https://raw.githubusercontent.com/openshift/pipelines-tutorial/pipelines-1.9/01_pipeline/04_pipeline.yaml
```

Comprobar con el siguiente comando que se agrego correctamente:
```shell
tkn pipeline list
```



