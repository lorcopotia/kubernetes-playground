
# Instructions for ROSA Workshop Barcelona

Lab User Interface

[https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/)

## URLs

https://cloud.redhat.com/experts/

ARO:
https://ws.mobb.cloud/
https://github.com/rh-mobb/aro-workshop-content

ROSA:
http://rosa-ws.mobb.cloud/
https://github.com/rh-mobb/rosa-workshop-content

Messages

Lab instructions: [https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/)

Data

aws_access_key_id: ADSDFJYTJTEE123456
aws_default_region: eu-central-1
aws_route53_domain: .sandbox198.example.com
aws_secret_access_key: ncRwNN...
aws_web_console_password: Sup3rS3cr3t!
aws_web_console_url: https://067187224584.signin.aws.amazon.com/console
aws_web_console_user_name: user@example.com
rosa_bastion_user_name: rosa
rosa_console_password: Sup3rS3cr3t!
rosa_console_url: none
rosa_console_user_name: user@example.com
rosa_sandbox_account_id: '067187224584'
rosa_subdomain_base: n1234.sandbox198.example.com
rosa_token_warning: true
rosa_user_password: Sup3rS3cr3t!


## Commands

```
[rosa@bastion ~]$ rosa version
1.2.29
I: There is a newer release version '1.2.30', please consider updating: https://console.redhat.com/openshift/downloads#tool-rosa
```

```
[rosa@bastion ~]$ aws sts get-caller-identity
{
    "UserId": "AIDAQ7JFLWAEA4AR6EGCI",
    "Account": "067187224584",
    "Arn": "arn:aws:iam::067187224584:user/rcarrata@redhat.com-n7fd6"
}
```

```
oc login https://api.rosa-n7fd6.o9xq.p1.openshiftapps.com:6443 --username cluster-admin --password ZGHd6-winr6-HCJF5-JnFHH

oc login https://api.rosa-n7fd6.o9xq.p1.openshiftapps.com:6443 --username cluster-admin --password $ADMIN_PASSWORD
SWORD
```

Cognito User Pool

```
[rosa@bastion ~]$ echo ${AWS_USER_POOL_ID}
eu-central-1_BfGnFch4x
```

Cognito URL callback 
```
`CLUSTER_DOMAIN=$(rosa describe cluster -c rosa-${GUID} | grep "DNS" | grep -oE '\S+.openshiftapps.com')  echo "OAuth callback URL: https://oauth-openshift.apps.${CLUSTER_DOMAIN}/oauth2callback/Cognito"`
```

CLIENTID and CLIENTSECRET variables:
```
`export AWS_USER_POOL_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id ${AWS_USER_POOL_ID} | jq -r .UserPoolClients[0].ClientId)  export AWS_USER_POOL_CLIENT_SECRET=$(aws cognito-idp describe-user-pool-client --user-pool-id ${AWS_USER_POOL_ID} --client-id ${AWS_USER_POOL_CLIENT_ID} | jq -r .UserPoolClient.ClientSecret)`
```


Setup cluster to user Cognito
```
`rosa create idp \ --cluster rosa-${GUID} \ --type openid \ --name Cognito \ --client-id ${AWS_USER_POOL_CLIENT_ID} \ --client-secret ${AWS_USER_POOL_CLIENT_SECRET} \ --issuer-url https://cognito-idp.$(aws configure get region).amazonaws.com/${AWS_USER_POOL_ID} \ --email-claims email \ --name-claims name \ --username-claims username`
```

To display just the names of the configured identity providers use this command
```
`oc get oauth cluster -o json | jq -r '.spec.identityProviders[].name'`
```

Cognito credentials:
```
admin : GNcjk1LAWtpr-2@23
```

## Scaling worker nodes

### Via the CLI

First, let’s see what MachinePools already exist in our cluster. To do so, run the following command:
    `rosa list machinepools -c rosa-${GUID}`

List MachineSets inside of the ROSA cluster
```
[rosa@bastion ~]$ oc -n openshift-machine-api get machine
NAME                                          PHASE     TYPE         REGION         ZONE            AGE
rosa-n7fd6-rd6rn-infra-eu-central-1a-mbrch    Running   r5.xlarge    eu-central-1   eu-central-1a   97m
rosa-n7fd6-rd6rn-infra-eu-central-1a-w66q5    Running   r5.xlarge    eu-central-1   eu-central-1a   97m
rosa-n7fd6-rd6rn-master-0                     Running   m5.2xlarge   eu-central-1   eu-central-1a   117m
rosa-n7fd6-rd6rn-master-1                     Running   m5.2xlarge   eu-central-1   eu-central-1a   117m
rosa-n7fd6-rd6rn-master-2                     Running   m5.2xlarge   eu-central-1   eu-central-1a   117m
rosa-n7fd6-rd6rn-worker-eu-central-1a-89znv   Running   m5.xlarge    eu-central-1   eu-central-1a   113m
rosa-n7fd6-rd6rn-worker-eu-central-1a-pxxql   Running   m5.xlarge    eu-central-1   eu-central-1a   113m
```

Create a MachinePool to add a new worker node using the ROSA
```
rosa create machinepool -c rosa-${GUID} --replicas 1 --name workshop --instance-type m5.xlarge
```

Scale up our selected MachinePool from one to two machines. To do so, run the following command:

`rosa update machinepool -c rosa-${GUID} --replicas 2 workshop`

Test autoscaler with Job:
```yaml
kind: Job
apiVersion: batch/v1
metadata:
  annotations:
    batch.kubernetes.io/job-tracking: ''
    kubectl.kubernetes.io/last-applied-configuration: >
      {"apiVersion":"batch/v1","kind":"Job","metadata":{"annotations":{},"name":"maxscale","namespace":"autoscale-ex"},"spec":{"backoffLimit":4,"completions":50,"parallelism":50,"template":{"spec":{"containers":[{"command":["sleep","300"],"image":"busybox","name":"work","resources":{"requests":{"cpu":"500m","memory":"500Mi"}},"securityContext":{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}}}],"restartPolicy":"Never"}}}}
  resourceVersion: '120742'
  name: maxscale
  uid: 5ff7991e-8e43-4805-b8ea-d69f977bc09b
  creationTimestamp: '2023-11-16T11:28:30Z'
  generation: 1
  namespace: autoscale-ex
  labels:
    controller-uid: 5ff7991e-8e43-4805-b8ea-d69f977bc09b
    job-name: maxscale
spec:
  parallelism: 50
  completions: 50
  backoffLimit: 4
  selector:
    matchLabels:
      controller-uid: 5ff7991e-8e43-4805-b8ea-d69f977bc09b
  template:
    metadata:
      creationTimestamp: null
      labels:
        controller-uid: 5ff7991e-8e43-4805-b8ea-d69f977bc09b
        job-name: maxscale
    spec:
      containers:
        - name: work
          image: busybox
          command:
            - sleep
            - '300'
          resources:
            requests:
              cpu: 500m
              memory: 500Mi
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: Always
          securityContext:
            capabilities:
              drop:
                - ALL
            allowPrivilegeEscalation: false
      restartPolicy: Never
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      securityContext: {}
      schedulerName: default-scheduler
  completionMode: NonIndexed
  suspend: false
status:
  startTime: '2023-11-16T11:28:30Z'
  active: 36
  succeeded: 14
  uncountedTerminatedPods: {}
  ready: 28
```

## Deploy an app to the labeled nodes

Now that we’ve successfully labeled our nodes, let’s deploy a workload to demonstrate app placement using `nodeSelector`. This should force our app to only our labeled nodes.

1.  First, let’s create a project (or namespace) for our application. To do so, run the following command:
    
    `oc new-project nodeselector-ex`
    
    Sample Output
    
    ```text
    Now using project "nodeselector-ex" on server "https://api.rosa-6n4s8.1c1c.p1.openshiftapps.com:6443".
    
    You can add applications to this project with the 'new-app' command. For example, try:
    
        oc new-app rails-postgresql-example
    
    to build a new example application in Ruby. Or use kubectl to deploy a simple Kubernetes application:
    
        kubectl create deployment hello-node --image=k8s.gcr.io/e2e-test-images/agnhost:2.33 -- /agnhost serve-hostname
    ```
    
2.  Next, let’s deploy our application and associated resources that will target our labeled nodes. To do so, run the following command:
    
    `cat << EOF | oc apply -f - --- kind: Deployment apiVersion: apps/v1 metadata:   name: nodeselector-app   namespace: nodeselector-ex spec:   replicas: 1   selector:     matchLabels:       app: nodeselector-app   template:     metadata:       labels:         app: nodeselector-app     spec:       nodeSelector:         tier: frontend       containers:       - name: hello-openshift         image: "docker.io/openshift/hello-openshift"         ports:         - containerPort: 8080           protocol: TCP         - containerPort: 8888           protocol: TCP         securityContext:           allowPrivilegeEscalation: false           capabilities:             drop:             - ALL EOF`
    
    Sample Output
    
    ```text
    deployment.apps/nodeselector-app created
    ```
    
3.  Now, let’s validate that the application has been deployed to one of the labeled nodes. To do so, run the following command:
    
    `oc -n nodeselector-ex get pod -l app=nodeselector-app -o json \   | jq -r .items[0].spec.nodeName`
    
    Sample Output
    
    ```text
    ip-10-0-146-31.us-east-2.compute.internal
    ```
    
4.  Double check the name of the node to compare it to the output above to ensure the node selector worked to put the pod on the correct node.
    
    `oc get nodes --selector='tier=frontend' -o name`
    
    Sample Output
    
    ```text
    node/ip-10-0-133-248.us-east-2.compute.internal
    node/ip-10-0-146-31.us-east-2.compute.internal
    node/ip-10-0-187-229.us-east-2.compute.internal
    node/ip-10-0-252-142.us-east-2.compute.internal
    ```
    
5.  Next create a `service` using the `oc expose` command
    
    `oc expose deployment nodeselector-app`
    
    Sample Output
    
    ```text
    service/nodeselector-app exposed
    ```
    
6.  Expose the newly created `service` with a `route`
    
    `oc create route edge --service=nodeselector-app  --insecure-policy=Redirect`
    
    Sample Output
    
    ```text
    route.route.openshift.io/nodeselector-app created
    ```
    
7.  Fetch the URL for the newly created `route`
    
    `oc get routes/nodeselector-app -o json | jq -r '.spec.host'`
    
    Sample Output
    
    ```text
    nodeselector-app-nodeselector-ex.apps.rosa-6n4s8.1c1c.p1.openshiftapps.com
    ```
    
    Then visit the URL presented in a new tab in your web browser.
    
    Note that the application is exposed over the default ingress using a predetermined URL and trusted TLS certificate. This is done using the OpenShift `Route` resource which is an extension to the Kubernetes `Ingress` resource.
    

Congratulations! You’ve successfully demonstrated the ability to label nodes and target those nodes using `nodeSelector`

## Pod Disruption Budget

A Pod disruption Budget (PBD) allows you to limit the disruption to your application when its pods need to be rescheduled for upgrades or routine maintenance work on ROSA nodes

-   Let’s create a Pod Disruption Budget for our `microsweeper-appservice` application. To do so, run the following command:
    
    `cat <<EOF | oc apply -f - apiVersion: policy/v1 kind: PodDisruptionBudget metadata:   name: microsweeper-appservice-pdb   namespace: microsweeper-ex spec:   minAvailable: 1   selector:     matchLabels:       deployment: microsweeper-appservice EOF`
    

A PodDisruptionBudget object’s configuration consists of the following key parts:

-   A label selector, which is a label query over a set of pods.
    
-   An availability level, which specifies the minimum number of pods that must be available simultaneously, either:
    
    -   minAvailable is the number of pods must always be available, even during a disruption.
        
    -   maxUnavailable is the number of pods can be unavailable during a disruption.
        
    

Warning

A maxUnavailable of 0% or 0 or a minAvailable of 100% or equal to the number of replicas can be used but will block nodes from being drained and can result in application instability during maintenance activities.

After creating the PDB, the OpenShift API will ensure at least one pod of `microsweeper-appservice` is running all the time, even when maintenance is going on within the cluster.
Next, let’s check the status of Pod Disruption Budget. To do so, run the following command:

`oc -n microsweeper-ex get poddisruptionbudgets`


## Creating HPA
In this exercise we will scale the `microsweeper-appservice` application based on CPU utilization:

-   Scale out when average CPU utilization is greater than 50% of CPU limit
    
-   Maximum pods is 4
    
-   Scale down to min replicas if utilization is lower than threshold for 60 sec
    
    1.  First, we should create the HorizontalPodAutoscaler. To do so, run the following command:
```
`cat <<EOF | oc apply -f - apiVersion: autoscaling/v2 kind: HorizontalPodAutoscaler metadata:   name: microsweeper-appservice-cpu   namespace: microsweeper-ex spec:   scaleTargetRef:     apiVersion: apps/v1     kind: Deployment     name: microsweeper-appservice   minReplicas: 2   maxReplicas: 4   metrics:     - type: Resource       resource:         name: cpu         target:           averageUtilization: 50           type: Utilization   behavior:     scaleDown:       stabilizationWindowSeconds: 60       policies:       - type: Percent         value: 100         periodSeconds: 15 EOF`
```

-   Next, check the status of the HPA. To do so, run the following command:
    
    `oc -n microsweeper-ex get horizontalpodautoscaler/microsweeper-appservice-cpu`
    
    Sample Output
    
    ```text
    NAME              REFERENCE                                        TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
    microsweeper-appservice-cpu   Deployment/microsweeper-appservice   0%/50%    2         4         3          43s
    ```
    
-   Next, let’s generate some load against the `microsweeper-appservice` application. To do so, run the following command:
    
    `FRONTEND_URL=http://$(oc -n microsweeper-ex get route microsweeper-appservice -o jsonpath='{.spec.host}')/  ab -c100 -n10000 ${FRONTEND_URL}`
    
-   Apache Bench will take around 100 seconds to complete (you can also hit CTRL-C to kill the ab command). Then immediately check the status of Horizontal Pod Autoscaler. To do so, run the following command:
    
    `oc -n microsweeper-ex get horizontalpodautoscaler/microsweeper-appservice-cpu`
    
    Sample Output
    
    ```text
    NAME                          REFERENCE                            TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
    microsweeper-appservice-cpu   Deployment/microsweeper-appservice   135%/50%   2         4         4          7m37s
    ```
    
    This means you are now running 4 replicas, instead of the original three that we started with.
    
-   Once you’ve killed the `ab` command, the traffic going to `microsweeper-appservice` service will cool down and after a 60 second cool down period, your application’s replica count will drop back down to two. To demonstrate this, run the following command:
    
    `oc -n microsweeper-ex get horizontalpodautoscaler/microsweeper-appservice-cpu --watch`
    
    After a minute or two, your output should be similar to below:
    
    ```text
    NAME                          REFERENCE                            TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
    microsweeper-appservice-cpu   Deployment/microsweeper-appservice   0%/50%     2         4         4          19m
    microsweeper-appservice-cpu   Deployment/microsweeper-appservice   0%/50%     2         4         4          19m
    microsweeper-appservice-cpu   Deployment/microsweeper-appservice   0%/50%     2         4         2          20m
    ```

## Deploying your Application with OpenShift GitOps

1.  From the OpenShift Console Administrator view click through **HOME** -> **Operators** -> **Operator Hub**, search for "openshift gitops" and click **Install**.
    
    For the update channel select **gitops-1.8**. Leave all other defaults and click **Install**.
    
    ![OpenShift Web Console - OpenShift GitOps in OperatorHub](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/gitops_operator.png)
    
2.  Wait until the operator shows as successfully installed (**Installed operator - ready for use**).
    
3.  In your bastion VM create a new project:
    
    `oc new-project bgd`
    
    Sample Output
    
    ```text
    Now using project "bgd" on server "https://api.rosa-6n4s8.1c1c.p1.openshiftapps.com:6443".
    
    You can add applications to this project with the 'new-app' command. For example, try:
    
        oc new-app rails-postgresql-example
    
    to build a new example application in Ruby. Or use kubectl to deploy a simple Kubernetes application:
    
        kubectl create deployment hello-node --image=k8s.gcr.io/e2e-test-images/agnhost:2.33 -- /agnhost serve-hostname
    ```
    
4.  Deploy ArgoCD into your project
    
    `cat <<EOF | oc apply -f - --- apiVersion: argoproj.io/v1alpha1 kind: ArgoCD metadata:   name: argocd   namespace: bgd spec:   sso:     dex:       openShiftOAuth: true       resources:         limits:           cpu: 500m           memory: 256Mi         requests:           cpu: 250m           memory: 128Mi     provider: dex   rbac:     defaultPolicy: "role:readonly"     policy: "g, system:authenticated, role:admin"     scopes: "[groups]"   server:     insecure: true     route:       enabled: true       tls:         insecureEdgeTerminationPolicy: Redirect         termination: edge EOF`
    
    Sample Output
    
    ```text
    argocd.argoproj.io/argocd created
    ```
    
5.  Wait for ArgoCD to be ready
    
    `oc rollout status deploy/argocd-server -n bgd`
    
    Sample Output
    
    ```text
    deployment "argocd-server" successfully rolled out
    ```
    
6.  Apply the GitOps application for your application:
    
    `cat <<EOF | oc apply -f - --- apiVersion: argoproj.io/v1alpha1 kind: Application metadata:   name: bgd-app   namespace: bgd spec:   destination:     namespace: bgd     server: https://kubernetes.default.svc   project: default   source:     path: apps/bgd/base     repoURL: https://github.com/rh-mobb/gitops-bgd-app     targetRevision: main   syncPolicy:     automated:       prune: true       selfHeal: false     syncOptions:     - CreateNamespace=false EOF`
    
    Sample Output
    
    ```text
    application.argoproj.io/bgd-app created
    ```
    
7.  Find the URL for your Argo CD dashboard, copy it to your web browser and log in using your OpenShift credentials (remind yourself what your password for user `admin` is by typing `echo ${COGNITO_ADMIN_PASSWORD}`)
    
    `oc get route argocd-server -n bgd -o jsonpath='{.spec.host}{"\n"}'`
    
    Sample Output
    
    ```text
    argocd-server-bgd.apps.rosa-6n4s8.1c1c.p1.openshiftapps.com
    ```
    
    ![argo app1](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/argo_app1.png)
    
8.  Click on the Application to show its topology
    
    ![argo sync](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/argo_sync.png)
    
9.  Verify that OpenShift sees the Deployment as rolled out
    
    `oc rollout status deploy/bgd`
    
    Sample Output
    
    ```text
    deployment "bgd" successfully rolled out
    ```
    
10.  Get the route and browse to it in your browser
    
    `oc get route bgd -n bgd -o jsonpath='{.spec.host}{"\n"}'`
    
    Sample Output
    
    ```text
    bgd-bgd.apps.rosa-6n4s8.1c1c.p1.openshiftapps.com
    ```
    
11.  You should see a green box in the website like so
    
    ![bgd green](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/bgd_green.png)
    
12.  Patch the OpenShift resource to force it to be out of sync with the github repository:
    
    `oc -n bgd patch deploy/bgd --type='json' \   -p='[{"op": "replace", "path":   "/spec/template/spec/containers/0/env/0/value", "value":"blue"}]'`
    
    Sample Output
    
    ```text
    deployment.apps/bgd patched
    ```
    
13.  Refresh Your browser and you should see a blue box in the website like so
    
    ![app blue](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/app_blue.png)
    
14.  Meanwhile check ArgoCD it should show the application as out of sync. Click the **Sync** button and then click on **Synchronize** to have it revert the change you made in OpenShift
    
    ![sync bgd](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/sync_bgd.png)
    
15.  Check again, you should see a green box in the website like so
    
    ![bgd green](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/bgd_green.png)
    

Congratulations! You have successfully deployed OpenShift Gitops

# Automate Deploying the App using OpenShift Pipelines

## Introduction

OpenShift Pipelines is a cloud-native, continuous integration and continuous delivery (CI/CD) solution based on Kubernetes resources. It uses Tekton building blocks to automate deployments across multiple platforms by abstracting away the underlying implementation details. Tekton introduces a number of standard Custom Resource Definitions (CRDs) for defining CI/CD pipelines that are portable across Kubernetes distributions. Some key features of OpenShift Pipelines include:

-   OpenShift Pipelines is a serverless CI/CD system that runs Pipelines with all the required dependencies in isolated containers.
    
-   OpenShift Pipelines are designed for decentralized teams that work on microservice-based architecture.
    
-   OpenShift Pipelines use standard CI/CD pipeline definitions that are easy to extend and integrate with the existing Kubernetes tools, enabling you to scale on-demand.
    
-   You can use OpenShift Pipelines to build images with Kubernetes tools such as Source-to-Image (S2I), Buildah, Buildpacks, and Kaniko that are portable across any Kubernetes platform.
    
-   You can use the OpenShift Container Platform Developer Console to create Tekton resources, view logs of Pipeline runs, and manage pipelines in your OpenShift Container Platform namespaces.
    

If you would like to read more about OpenShift Pipelines, [see the Red Hat documentation](https://docs.openshift.com/container-platform/4.13/cicd/pipelines/understanding-openshift-pipelines.html).

## Install the OpenShift Pipelines operator

Warning

**GitHub Account Required**

This section of the workshop requires a personal [GitHub](https://github.com) account. If you do not have a GitHub account and do not wish to create one, you can skip this section and move to the next section.

1.  Return to your tab with the OpenShift Web Console.
    
2.  Using the menu on the left select **Operator -> OperatorHub**.
    
    ![Web Console - OperatorHub Sidebar](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/web-console-operatorhub-menu.png)
    
3.  In the search box, search for "OpenShift Pipelines" and click on the _Red Hat OpenShift Pipelines_ box.
    
    ![Web Console - OpenShift Pipelines Operator Selection](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/web-console-operatorhub-openshift-pipelines.png)
    
4.  Click on _Install_ on the page that appears.
    
    ![Web Console - OpenShift Pipelines Simple Install](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/web-console-openshift-pipelines-simple-install.png)
    
5.  Select **pipelines-1.10** for the **Update channel** and accept the other defaults that are presented, then click on **Install** to install the operator.
    
    ![Web Console - OpenShift Pipelines Detailed Install](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/web-console-openshift-pipelines-detailed-install.png)
    
6.  Allow the operator a few minutes to successfully install the OpenShift Pipelines operator into the cluster.
    
    ![Web Console - OpenShift Pipelines Successful Install](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/web-console-openshift-pipelines-successful-install.png)
    

## Configure the GitHub integration

1.  In your web browser, go to the following GitHub repositories:
    
    -   [https://github.com/rh-mobb/common-java-dependencies](https://github.com/rh-mobb/common-java-dependencies)
        
    -   [https://github.com/rh-mobb/rosa-workshop-app](https://github.com/rh-mobb/rosa-workshop-app)
        
    
2.  Ensure you are logged in to GitHub and select the _Fork_ button for **both** repositories and then choose your own GitHub account.
    
    ![GitHub Repository Fork](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/github-fork.png)
    
3.  Next, browse to [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new) and create a new GitHub Personal Access Token. Use **rosa-workshop** for the Name, set the **Expiration** to `7 Days` and the **Scope** to "repo" and click _Generate Token_.
    
    ![GitHub Personal Access Token](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/github-personal-access-token.png)
    
    Warning
    
    **Do not** forget to delete this token once the workshop is over.
    
4.  Next, save the token to your cloud bastion host. To do so, run the following command, ensuring you replace the `replaceme` with your Personal Access Token:
    
    ```sh
    export GH_TOKEN=replaceme
    ```
    
5.  Then, save your GitHub username as a variable. To do so, run the following command, ensuring you replace the `replaceme` with your GitHub username.
    
    ```sh
    export GH_USER=replaceme
    ```
    
6.  Next, we’ll create a new working directory to clone our forked GitHub repositories. To do so, run the following commands:
    
    `mkdir ~/gitops  cd ~/gitops  git clone https://github.com/${GH_USER}/common-java-dependencies.git  git clone https://github.com/${GH_USER}/rosa-workshop-app.git`
    

## Import tasks to our pipeline

The next thing we need to do is import common tasks that our pipeline will use. These common tasks are designed to be reused across multiple pipelines.

1.  Switch back to the `microsweeper-ex` project from earlier:
    
    `oc project microsweeper-ex`
    
2.  Let’s start by taking a look at the reusable tasks that we will be using. To do so, run the following command:
    
    `ls ~/gitops/rosa-workshop-app/pipeline/tasks/*.yaml`
    
    Sample Output
    
    ```texinfo
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/1-git-clone.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/2-mvn.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/3-mvn-build-image.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/4-apply-manifest.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/5-update-deployment.yaml
    ```
    
    -   `1-git-clone.yaml`: Clones a given GitHub Repo.
        
    -   `2-mvn.yaml`: This Task can be used to run a Maven build
        
    -   `3-mvn-build-image.yaml`: Packages source with maven builds and into a container image, then pushes it to a container registry. Builds source into a container image using Project Atomic’s Buildah build tool. It uses Buildah’s support for building from Dockerfiles, using its buildah bud command.This command executes the directives in the Dockerfile to assemble a container image, then pushes that image to a container registry.
        
    -   `4-apply-manifest.yaml`: Applied manifest files to the cluster
        
    -   `5-update-deployment.yaml`: Updates a deployment with the new container image.
        
    
3.  Next, we need to apply all of these tasks to our cluster. To do so, run the following command:
    
    `oc apply -n microsweeper-ex -f \   ~/gitops/rosa-workshop-app/pipeline/tasks`
    
    Sample Output
    
    ```texinfo
    task.tekton.dev/git-clone created
    task.tekton.dev/maven created
    task.tekton.dev/build-maven-image created
    task.tekton.dev/apply-manifests created
    task.tekton.dev/update-deployment created
    ```
    

## Configure our pipeline

1.  Next, create the pipeline service account and permissions that the pipeline tasks will run under. To do so, run the following command:
    
    `oc create -f ~/gitops/rosa-workshop-app/pipeline/1-pipeline-account.yaml`
    
    Sample Output
    
    ```texinfo
    secret/kube-api-secret created
    role.rbac.authorization.k8s.io/pipeline-role created
    rolebinding.rbac.authorization.k8s.io/pipeline-role-binding created
    ```
    
2.  We also need to give the pipeline permission for certain privileged security context constraints to that it can execute builds. To grant these permissions, run the following command:
    
    `oc -n microsweeper-ex adm policy add-scc-to-user anyuid -z pipeline oc -n microsweeper-ex adm policy add-scc-to-user privileged -z pipeline`
    
3.  Create a persistent volume claim that the pipeline will use to store build images. To do so, run the following command:
    
    `oc create -f ~/gitops/rosa-workshop-app/pipeline/2-pipeline-pvc.yaml`
    
4.  Next, let’s review the pipeline definition. To do so, open the following link in a new tab: [https://github.com/rh-mobb/rosa-workshop-app/blob/main/pipeline/3-pipeline.yaml](https://github.com/rh-mobb/rosa-workshop-app/blob/main/pipeline/3-pipeline.yaml).
    
    Browse through the file and notice all the tasks that are being executed. These are the tasks we imported in the previous step. The pipeline definition simply says which order the tasks are run and what parameters should be passed between tasks.
    

## Update Application Settings

1.  Now that we have the source code forked, we need to copy the properties file we created in the previous section to our new code base. To do so, run the following command:
    
    `cp ~/rosa-workshop-app/src/main/resources/application.properties \    ~/gitops/rosa-workshop-app/src/main/resources/application.properties`
    
2.  Next, let’s configure our Git CLI. To do so, run the following commands:
    
    `git config --global user.email "${GH_USER}@github.io" git config --global user.name "${GH_USER}"`
    
3.  Finally, let’s commit our changes to GitHub. To do so, run the following set of commands:
    
    `cd ~/gitops/rosa-workshop-app  git remote set-url origin https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/rosa-workshop-app  git add .  git commit -am "Update Properties File"  git push`
    
4.  In addition, let’s go ahead and create a secret with our GitHub credentials that we will need later. To do so, run the following command:
    
    `cat << EOF | oc apply -f - --- apiVersion: v1 kind: Secret metadata:   name: gitsecret   annotations:     tekton.dev/git-0: https://github.com   namespace: microsweeper-ex type: kubernetes.io/basic-auth stringData:   username: ${GH_USER}   secretToken: ${GH_TOKEN} EOF`
    
5.  Now let’s proceed with creating our pipeline definition. To do so, run the following command:
    
    `oc create -f ~/gitops/rosa-workshop-app/pipeline/3-pipeline.yaml`
    
6.  Finally, we will create a pipeline run that will execute the pipeline, pull the code from your forked GitHub repositories, build the image, and deploy it to ROSA. To do this, run the following command:
    
    `cat << EOF | oc create -f - --- apiVersion: tekton.dev/v1beta1 kind: PipelineRun metadata:   generateName: minesweeper-pipeline-   namespace: microsweeper-ex spec:   pipelineRef:     name: maven-pipeline   serviceAccountName: pipeline   params:   - name: application-name     value: microsweeper-appservice   - name: dependency-git-url     value: https://github.com/${GH_USER}/common-java-dependencies   - name: application-git-url     value: https://github.com/${GH_USER}/rosa-workshop-app   - name: dockerfile-path     value: src/main/docker/Dockerfile.jvm   - name: image-name     value: image-registry.openshift-image-registry.svc:5000/microsweeper-ex/minesweeper   workspaces:   - name: source     persistentVolumeClaim:       claimName: minesweeper-source-pvc EOF`
    

## Validate the pipeline

Let’s take a look at the OpenShift Web Console to see what was created and if the application was successfully deployed.

Warning

Make sure your Project is set to `microsweeper-ex`

1.  From the OpenShift Web Console, click on **Pipelines** -> **Tasks**.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/pipeline-tasks-ocp.png)
    
    Notice the 5 tasks that we imported and click into them to view the YAML definitions.
    
2.  Next, lets look at the Pipeline. Click on **Pipelines**. Notice that it is either still running, or the last run was successful. Click on _maven-pipeline_ to view the pipeline details.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/pipeline-ocp.png)
    
3.  On the following screen, click on **PipelineRuns** to view the status of each Pipeline Run.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/pipeline-run-ocp.png)
    
4.  Lastly, click on the **PipelineRun** name and you can see all the details and steps of the pipeline. If your are curious, you can also view the logs of the different tasks that were run.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/pipeline-run-details-ocp.png)
    
5.  Watch the PipelineRun page as the tasks complete and the PipelineRun finishes.
    

## Event Triggering

At this point, we can successfully build and deploy new code by manually running our pipeline. But how can we configure the pipeline to run automatically when we commit code to Git? We can do so with an Event Listener and a Trigger.

1.  Let’s start by looking at the resources we will be creating to create our event listener and trigger.
    
    `ls ~/gitops/rosa-workshop-app/pipeline/tasks/event-listener/*.yaml`
    
    Sample Output
    
    ```texinfo
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/event-listener/1-web-trigger-binding.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/event-listener/2-web-trigger-template.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/event-listener/3-web-trigger.yaml
    /home/rosa/gitops/rosa-workshop-app/pipeline/tasks/event-listener/4-event-listener.yaml
    ```
    
2.  Take a look at the files listed:
    
    -   `1-web-trigger-binding.yaml` This TriggerBinding allows you to extract fields, such as the git repository name, git commit number, and the git repository URL in this case. To learn more about TriggerBindings, click [here](https://tekton.dev/docs/triggers/triggerbindings/)
        
    -   `2-web-trigger-template.yaml` The TriggerTemplate specifies how the pipeline should be run. Browsing the file above, you will see there is a definition of the PipelineRun that looks exactly like the PipelineRun you create in the previous step. This is by design! …​ it should be the same.
        
        To learn more about TriggerTemplates, [review the Tekton documentation](https://tekton.dev/docs/triggers/triggertemplates/).
        
    -   `3-web-trigger.yaml` The next file we have is the Trigger. The Trigger specifies what should happen when the EventListener detects an Event. Looking at this file, you will see that we are looking for 'Push' events that will create an instance of the TriggerTemplate that we just created. This in turn will start the PipelineRun.
        
        To learn more about Triggers, [review the Tekton documentation](https://tekton.dev/docs/triggers/triggers/).
        
    -   `4-event-listenter.yaml` The last file we have is the Event Listener. An EventListener is a Kubernetes object that listens for events at a specified port on your OpenShift cluster. It exposes an OpenShift Route that receives incoming event and specifies one or more Triggers.
        
        To learn more about EventListeners, [review the Tekton documentation](https://tekton.dev/docs/triggers/eventlisteners/).
        
    
3.  Next, let’s update our web trigger template with your GitHub username. To do this, let’s run the following command:
    
    `sed -i "s/GITHUB_USER_ID/${GH_USER}/g" \   ~/gitops/rosa-workshop-app/pipeline/tasks/event-listener/2-web-trigger-template.yaml`
    
4.  Now that you have reviewed all the files, let’s apply them to our cluster.
    
    `oc -n microsweeper-ex create -f \   ~/gitops/rosa-workshop-app/pipeline/tasks/event-listener`
    
    ```texinfo
    triggerbinding.triggers.tekton.dev/minesweeper-trigger-binding created
    triggertemplate.triggers.tekton.dev/minesweeper-trigger-template created
    trigger.triggers.tekton.dev/minesweeper-trigger created
    eventlistener.triggers.tekton.dev/minesweeper-el created
    ```
    
5.  Before we test out our EventListener and Trigger, lets review what was created in OpenShift.
    
6.  From the OpenShift console, under Pipelines, click on Triggers.
    
7.  Browse the EventListener, TriggerTemplate and TriggerBindings that you just created. ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/ocp-triggers.png)
    
    The next thing we need to do, is connect our EventListener with Git. When an action, such as a git push, happens, git will need to call our EventListener to start the build and deploy process.
    
8.  First we need to do is expose our EventListener service to the internet. To do so, we’ll run the `oc expose` command:
    
    `oc -n microsweeper-ex expose svc el-minesweeper-el`
    
9.  To get the URL of the Event Listener Route that we just created, run the following command:
    
    `oc -n microsweeper-ex get route el-minesweeper-el \    -o jsonpath="http://{.spec.host}{'\n'}"`
    
    Sample Output
    
    ```texinfo
    http://el-minesweeper-el-microsweeper-ex.apps.rosa-8wqxv.1yyt.p1.openshiftapps.com
    ```
    
10.  The last step we need to do, is configure GitHub to call this event listener URL when events occur.
    
    From your browser, go to your personal GitHub rosa-workshop-app repository, and click on **Settings**.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/git-settings.png)
    
11.  On the next screen, click on **Webhooks**.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/git-settings-webhook.png)
    
12.  Click on the **Add Webhook** button.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/git-add-webhook.png)
    
13.  On the next screen, enter the following settings:
    
    -   **PayloadURL** - enter the URL you got above (for example: `http://el-minesweeper-el-microsweeper-ex.apps.rosa-8wqxv.1yyt.p1.openshiftapps.com`)
        
    -   **ContentType** - select application/json
        
    -   **Secret** - this your GitHub Personal Access Token (`echo $GH_TOKEN`)
        
        Where does the secret value come from? Refer to the `~/gitops/rosa-workshop-app/pipeline/tasks/event-listener/3-web-trigger.yaml` file.
        
        You will see the following snippet that contains the secret to access git.
        
        ```yaml
          interceptors:
            - ref:
                name: "github"
              params:
                - name: "secretRef"
                  value:
                    secretName: gitsecret
                    secretKey: secretToken
                - name: "eventTypes"
                  value: ["push"]
        ```
        
        The secret you enter here for the git webhook, needs to match the value for the **secretToken** key of the a secret named gitsecret. If you remember in the previous step, we created this secret and used your git token as this value.
        
    
14.  Keep the remaining defaults, and click _Add webhook_.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/add-webhook.png)
    

### Test the Event Triggering

Now that we have our trigger, eventlistener and git webhook setup, lets test it out.

1.  Make sure you are in the directory for your personal git repo where the application is, and edit the `./src/main/resources/META-INF/resources/index.html` file.
    
2.  Search for Leaderboard and change it to <YOUR NAME> Leaderboard.
    
    `cd ~/gitops/rosa-workshop-app vim src/main/resources/META-INF/resources/index.html`
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/html-edit.png)
    
3.  Now commit and push the change:
    
    `git commit -am 'Updated leaderboard title' git push`
    
4.  Pushing the change to the your git repository will kick of the event listener which will start the pipeline.
    
    Quickly switch over to your OpenShift Web Console, and watch the pipeline run.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/watch-pipeline.png)
    
5.  Once the pipeline finishes, check out the change. From the OpenShift Web Console, click on _Networking_ -> _Routes_.
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/route-2.png)
    
6.  You should see the updated application with a new title for the leaderboard!
    
    ![Image](https://bookbag-n7fd6-bookbag.apps.shared-410.openshift.redhatworkshops.io/workshop/media/updated-minesweeper.png)
    

Congratulations! You’ve successfully installed OpenShift Pipelines and used it to deploy an application.

