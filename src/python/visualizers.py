import os
import string
import json
import random
from IPython.core.display import HTML


def id_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return "i"+''.join(random.choice(chars) for _ in range(size))


class SimpleListVisualizer:
    def visualize(self, outNames, featureNames, featureEffects):
        bundlePath = os.path.join(os.path.split(__file__)[0], "bundle.js")
        with open(bundlePath, 'r') as myfile:
            bundleData = myfile.read()
        id = id_generator()
        data = [{"name": featureNames[i], "effect": featureEffects[i]} for i in range(len(featureNames))]
        return HTML(
            "<script>{bundleData}</script>".format(bundleData=bundleData) +
            "<simple-list id='{id}'></simple-list>".format(id=id) +
            "<script>document.querySelector('#"+id+"').draw("+json.dumps(data)+");</script>"
        )


class AdditiveForceVisualizer:
    def visualize(self, outNames, featureNames, featureEffects):
        bundlePath = os.path.join(os.path.split(__file__)[0], "bundle.js")
        with open(bundlePath, 'r') as myfile:
            bundleData = myfile.read()
        id = id_generator()
        data = {"outNames": outNames, "features": [{"name": featureNames[i], "effect": featureEffects[i]} for i in range(len(featureNames))]}
        return HTML(
            "<script>"+bundleData+"</script>"+
            "<additive-force id='"+id+"'></additive-force>"+
            "<script>document.querySelector('#"+id+"').draw("+json.dumps(data)+");</script>"
        )
