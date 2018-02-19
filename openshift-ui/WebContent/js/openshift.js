var mainApp = angular.module("mainApp", []);

mainApp.controller('controller', function($scope) {

	$scope.submitForm=function(){
		
    	if($scope.github){
   
    		var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
                var blob = new Blob([$scope.jenkinsfilePreview + $scope.finalJenkins], {type: 'application/octet-stream'}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = 'Jenkinsfile';
                a.click();
                window.URL.revokeObjectURL(url);
    	}
    	

		var b = document.createElement("a");
        document.body.appendChild(b);
        b.style = "display: none";
            var blob = new Blob([$scope.yamlfile], {type: 'octet-stream'}),
                url = window.URL.createObjectURL(blob);
            b.href = url;
            b.download = 'template.yaml';
            b.click();
            window.URL.revokeObjectURL(url);
        
    }
    $scope.preview = function(){
    	$scope.warningflag = false;
    	if($scope.github && $scope.oproject && $scope.gproject){
    		$scope.modalHeader = "Jenkinsfile Preview";
    		document.getElementById("mHeader").style.color = "green";
    		$scope.defaultJenkins = '\/\/ Run this node on a Maven Slave\n\t\/\/ Maven Slaves have JDK and Maven already installed\n\tnode(\'maven\') {\n\t  \/\/ Make sure your nexus_openshift_settings.xml\n\t  \/\/ Is pointing to your nexus instance\n\t  def mvnCmd = \"mvn\"\n\t\n\t  stage(\'Checkout Source\') {\n\t    \/\/ Get Source Code from SCM (Git) as configured in the Jenkins Project\n\t    \/\/ Next line for inline script, \"checkout scm\" for Jenkinsfile from Gogs\n\t    \/\/git \'http:\/\/gogs.xyz-gogs.svc.cluster.local:3000\/CICDLabs\/openshift-tasks.git\'\n\t    checkout scm\n\t  }\n\t\n\t  \/\/ The following variables need to be defined at the top level and not inside\n\t  \/\/ the scope of a stage - otherwise they would not be accessible from other stages.\n\t  \/\/ Extract version and other properties from the pom.xml\n\t  def groupId    = getGroupIdFromPom(\"pom.xml\")\n\t  def artifactId = getArtifactIdFromPom(\"pom.xml\")\n\t  def version    = getVersionFromPom(\"pom.xml\")\n\t\n\t  stage(\'Build war\') {\n\t    echo \"Building version ${version}\"\n\t\n\t    sh \"${mvnCmd} clean package -DskipTests\"\n\t  }\n\t  stage(\'Unit Tests\') {\n\t    echo \"Unit Tests\"\n\t    sh \"${mvnCmd} test\"\n\t  }\n\t  \n\t\n\t  stage(\'Build OpenShift Image\') {\n\t    def newTag = \"TestingCandidate-${version}\"\n\t    echo \"New Tag: ${newTag}\"\n\t\n\t    \/\/ Copy the war file we just built and rename to ROOT.war\n\t    sh \"cp .\/target\/openshift-tasks.war .\/ROOT.war\"\n\t\n\t    \/\/ Start Binary Build in OpenShift using the file we just published\n\t    \/\/ Replace xyz-tasks-dev with the name of your dev project\n\t    sh \"oc project xyz-tasks-dev\"\n\t    sh \"oc start-build tasks --follow --from-file=.\/ROOT.war -n xyz-tasks-dev\"\n\t\n\t    openshiftTag alias: \'false\', destStream: \'tasks\', destTag: newTag, destinationNamespace: \'xyz-tasks-dev\', namespace: \'xyz-tasks-dev\', srcStream: \'tasks\', srcTag: \'latest\', verbose: \'false\'\n\t  }\n\t\n\t  ';
    		$scope.devJenkins = 'stage(\'Deploy to Dev\') {\n\t    \/\/ Patch the DeploymentConfig so that it points to the latest TestingCandidate-${version} Image.\n\t    \/\/ Replace xyz-tasks-dev with the name of your dev project\n\t    sh \"oc project xyz-tasks-dev\"\n\t    sh \"oc patch dc tasks --patch \'{\\\"spec\\\": { \\\"triggers\\\": [ { \\\"type\\\": \\\"ImageChange\\\", \\\"imageChangeParams\\\": { \\\"containerNames\\\": [ \\\"tasks\\\" ], \\\"from\\\": { \\\"kind\\\": \\\"ImageStreamTag\\\", \\\"namespace\\\": \\\"xyz-tasks-dev\\\", \\\"name\\\": \\\"tasks:TestingCandidate-$version\\\"}}}]}}\' -n xyz-tasks-dev\"\n\t\n\t    openshiftDeploy depCfg: \'tasks\', namespace: \'xyz-tasks-dev\', verbose: \'false\', waitTime: \'\', waitUnit: \'sec\'\n\t    openshiftVerifyDeployment depCfg: \'tasks\', namespace: \'xyz-tasks-dev\', replicaCount: \'1\', verbose: \'false\', verifyReplicaCount: \'false\', waitTime: \'\', waitUnit: \'sec\'\n\t    openshiftVerifyService namespace: \'xyz-tasks-dev\', svcName: \'tasks\', verbose: \'false\'\n\t  }\n\t\n\t  stage(\'Integration Test\') {\n\t    \/\/ TBD: Proper test\n\t    \/\/ Could use the OpenShift-Tasks REST APIs to make sure it is working as expected.\n\t\n\t    def newTag = \"ProdReady-${version}\"\n\t    echo \"New Tag: ${newTag}\"\n\t\n\t    \/\/ Replace xyz-tasks-dev with the name of your dev project\n\t    openshiftTag alias: \'false\', destStream: \'tasks\', destTag: newTag, destinationNamespace: \'xyz-tasks-dev\', namespace: \'xyz-tasks-dev\', srcStream: \'tasks\', srcTag: \'latest\', verbose: \'false\'\n\t  }';
    		$scope.prodJenkins = '\/\/ Blue\/Green Deployment into Production\n\t  \/\/ -------------------------------------\n\t  def dest   = \"tasks-green\"\n\t  def active = \"\"\n\t\n\t  stage(\'Prep Production Deployment\') {\n\t    \/\/ Replace xyz-tasks-dev and xyz-tasks-prod with\n\t    \/\/ your project names\n\t    sh \"oc project xyz-tasks-prod\"\n\t    sh \"oc get route tasks -n xyz-tasks-prod -o jsonpath=\'{ .spec.to.name }\' > activesvc.txt\"\n\t    active = readFile(\'activesvc.txt\').trim()\n\t    if (active == \"tasks-green\") {\n\t      dest = \"tasks-blue\"\n\t    }\n\t    echo \"Active svc: \" + active\n\t    echo \"Dest svc:   \" + dest\n\t  }\n\t  stage(\'Deploy new Version\') {\n\t    echo \"Deploying to ${dest}\"\n\t\n\t    \/\/ Patch the DeploymentConfig so that it points to\n\t    \/\/ the latest ProdReady-${version} Image.\n\t    \/\/ Replace xyz-tasks-dev and xyz-tasks-prod with\n\t    \/\/ your project names.\n\t    sh \"oc patch dc ${dest} --patch \'{\\\"spec\\\": { \\\"triggers\\\": [ { \\\"type\\\": \\\"ImageChange\\\", \\\"imageChangeParams\\\": { \\\"containerNames\\\": [ \\\"$dest\\\" ], \\\"from\\\": { \\\"kind\\\": \\\"ImageStreamTag\\\", \\\"namespace\\\": \\\"xyz-tasks-dev\\\", \\\"name\\\": \\\"tasks:ProdReady-$version\\\"}}}]}}\' -n xyz-tasks-prod\"\n\t\n\t    openshiftDeploy depCfg: dest, namespace: \'xyz-tasks-prod\', verbose: \'false\', waitTime: \'\', waitUnit: \'sec\'\n\t    openshiftVerifyDeployment depCfg: dest, namespace: \'xyz-tasks-prod\', replicaCount: \'1\', verbose: \'false\', verifyReplicaCount: \'true\', waitTime: \'\', waitUnit: \'sec\'\n\t    openshiftVerifyService namespace: \'xyz-tasks-prod\', svcName: dest, verbose: \'false\'\n\t  }\n\t  stage(\'Switch over to new Version\') {\n\t    input \"Switch Production?\"\n\t\n\t    \/\/ Replace xyz-tasks-prod with the name of your\n\t    \/\/ production project\n\t    sh \'oc patch route tasks -n xyz-tasks-prod -p \\\'{\"spec\":{\"to\":{\"name\":\"\' + dest + \'\"}}}\\\'\'\n\t    sh \'oc get route tasks -n xyz-tasks-prod > oc_out.txt\'\n\t    oc_out = readFile(\'oc_out.txt\')\n\t    echo \"Current route configuration: \" + oc_out\n\t  }';
    	    $scope.finalJenkins = '}\n\t\n\t\/\/ Convenience Functions to read variables from the pom.xml\n\tdef getVersionFromPom(pom) {\n\t  def matcher = readFile(pom) =~ \'<version>(.+)<\/version>\'\n\t  matcher ? matcher[0][1] : null\n\t}\n\tdef getGroupIdFromPom(pom) {\n\t  def matcher = readFile(pom) =~ \'<groupId>(.+)<\/groupId>\'\n\t  matcher ? matcher[0][1] : null\n\t}\n\tdef getArtifactIdFromPom(pom) {\n\t  def matcher = readFile(pom) =~ \'<artifactId>(.+)<\/artifactId>\'\n\t  matcher ? matcher[0][1] : null\n}';
    		$scope.jenkinsfilePreview = $scope.defaultJenkins+$scope.finalJenkins;
    		if($scope.dev){
    			$scope.jenkinsfilePreview = $scope.jenkinsfilePreview +  $scope.devJenkins;
    		}
    		if($scope.prod){
    			$scope.jenkinsfilePreview = $scope.jenkinsfilePreview +  $scope.prodJenkins;
    		}
    		if($scope.uat){
    			
    		}
    	} else {
    		$scope.modalHeader = "Warning Message";
    		$scope.warningflag = true;
    		$scope.jenkinsfilePreview = "please select all mandatory fields";
    		document.getElementById("jpreview").style.color = "red";
    	}
    	
    }
    $scope.yamlfile = 'apiVersion: v1\nkind: Template\nlabels:\n  template: openshift-tasks-jenkinsfile\nmetadata:\n  name: openshift-tasks-jenkinsfile\nobjects:\n- apiVersion: v1\n  kind: BuildConfig\n  metadata:\n    annotations:\n      pipeline.alpha.openshift.io\/uses: \'[{\"name\": \"jkf-tasks\", \"namespace\": \"\", \"kind\": \"DeploymentConfig\"}]\'\n    labels:\n      application: ${APPLICATION_NAME}-jenkinsfile\n    name: ${APPLICATION_NAME}-jenkinsfile\n  spec:\n    source:\n      git:\n        ref: ${SOURCE_REF}\n        uri: ${SOURCE_URL}\n      type: Git\n    strategy:\n      jenkinsPipelineStrategy:\n        jenkinsfilePath: Jenkinsfile\n      type: JenkinsPipeline\n      type: Generic\n    triggers:\n    - github:\n        secret: kJZLvfQr3hZg\n      type: GitHub\n    - generic:\n        secret: kJZLvfQr3hZg\n      type: Generic\nparameters:\n- description: The name for the application.\n  name: APPLICATION_NAME\n  required: true\n  value: jkf-tasks\n- description: The name of Dev project\n  name: DEV_PROJECT\n  required: true\n  value: ocp-tasks\n- description: Git source URI for application\n  name: SOURCE_URL\n  required: true\n  value: https:\/\/github.com\/lbroudoux\/openshift-tasks\n- description: Git branch\/tag reference\n  name: SOURCE_REF\n  value: master';
alert($scope.yamlfile)
});