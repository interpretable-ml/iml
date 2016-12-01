from __future__ import unicode_literals
import os
import io
import string
import json
import random
from IPython.core.display import HTML
import base64
import numpy as np
import scipy.cluster
from .explanations import Explanation, AdditiveExplanation
import collections


errMsg = """
<div style='color: #900; text-align: center;'>
  <b>Visualization omitted, iML Javascript library not loaded!</b><br>
  Have you run `IML.initjs()` in this notebook? If this notebook was from another
  user you must also trust this notebook (File -> Trust notebook).
</div>"""


def js_build_dir():
    path = os.path.join(os.path.split(__file__)[0], "..", "..", "javascript", "build")
    if not os.path.isdir(path):
        path = os.path.join(os.path.split(__file__)[0], "..", "javascript", "build")
    return path


def initjs():
    bundlePath = os.path.join(js_build_dir(), "bundle.js")
    bundleData = io.open(bundlePath, encoding="utf-8").read()
    logoPath = os.path.join(js_build_dir(), "logoSmallGray.png")
    logoData = base64.b64encode(open(logoPath, "rb").read()).decode('utf-8')
    return HTML(
        "<div align='center'><img src='data:image/png;base64,{logoData}' /></div>".format(logoData=logoData) +
        "<script>{bundleData}</script>".format(bundleData=bundleData)
    )


def id_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return "i"+''.join(random.choice(chars) for _ in range(size))


def ensure_float(x):
    return float(np.asscalar(x) if isinstance(x, np.generic) else x)


def visualize(e):
    if isinstance(e, AdditiveExplanation):
        return AdditiveForceVisualizer(e).html()
    elif isinstance(e, Explanation):
        return SimpleListVisualizer(e).html()
    elif isinstance(e, collections.Sequence) and len(e) > 0 and isinstance(e[0], AdditiveExplanation):
        return AdditiveForceArrayVisualizer(e).html()
    else:
        assert False, "visualize() can only display Explanation objects (or arrays of them)!"


class SimpleListVisualizer:
    def __init__(self, e):
        assert isinstance(e, Explanation), "SimpleListVisualizer can only visualize Explanation objects!"

        # build the json data
        features = {}
        for i in filter(lambda j: e.effects[j] != 0, range(len(e.data.groupNames))):
            features[i] = {
                "effect": e.effects[i],
                "value": e.instance.groupDisplayValues[i]
            }
        self.data = {
            "outNames": e.model.outNames,
            "base_value": e.base_value,
            "link": str(e.link),
            "featureNames": e.data.groupNames,
            "features": features
        }

    def html(self):
        return HTML("""
<div id='{id}'>{errMsg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.SimpleListVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(errMsg=errMsg, data=json.dumps(self.data), id=id_generator()))


class AdditiveForceVisualizer:
    def __init__(self, e):
        assert isinstance(e, AdditiveExplanation), \
            "AdditiveForceVisualizer can only visualize AdditiveExplanation objects!"

        # build the json data
        features = {}
        for i in filter(lambda j: e.effects[j] != 0, range(len(e.data.groupNames))):
            features[i] = {
                "effect": ensure_float(e.effects[i]),
                "value": ensure_float(e.instance.groupDisplayValues[i])
            }
        self.data = {
            "outNames": e.model.outNames,
            "baseValue": ensure_float(e.base_value),
            "outValue": ensure_float(e.out_value),
            "link": str(e.link),
            "featureNames": e.data.groupNames,
            "features": features
        }

    def html(self):
        return HTML("""
<div id='{id}'>{errMsg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(errMsg=errMsg, data=json.dumps(self.data), id=id_generator()))


class AdditiveForceArrayVisualizer:
    def __init__(self, arr):
        assert isinstance(arr[0], AdditiveExplanation), \
            "AdditiveForceArrayVisualizer can only visualize arrays of AdditiveExplanation objects!"

        # order the samples by their position in a hierarchical clustering
        if all([e.model.f == arr[1].model.f for e in arr]):
            m = np.vstack([e.effects for e in arr])
            D = np.vstack([np.sum((m - m[i,:])**2, 1) for i in range(m.shape[0])])
            clustOrder = scipy.cluster.hierarchy.leaves_list(scipy.cluster.hierarchy.complete(D))
        else:
            assert False, "Tried to visualize an array of explanations from different models!"

        # make sure that we put the higher predictions first...just for consistency
        if sum(arr[clustOrder[0]].effects) < sum(arr[clustOrder[-1]].effects):
            np.flipud(clustOrder) # reverse

        # build the json data
        clustOrder = np.argsort(clustOrder) # inverse permutation
        self.data = {
            "outNames": arr[0].model.outNames,
            "baseValue": arr[0].base_value,
            "link": arr[0].link.__str__(),
            "featureNames": arr[0].data.groupNames,
            "explanations": []
        }
        for (ind,e) in enumerate(arr):
            self.data["explanations"].append({
                "outValue": ensure_float(e.out_value),
                "simIndex": ensure_float(clustOrder[ind])+1,
                "features": {}
            })
            for i in filter(lambda j: e.effects[j] != 0 or e.instance.x[0,j] != 0, range(len(e.data.groupNames))):
                self.data["explanations"][-1]["features"][i] = {
                    "effect": ensure_float(e.effects[i]),
                    "value": ensure_float(e.instance.groupDisplayValues[i])
                }

    def html(self):
        return HTML("""
<div id='{id}'>{errMsg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceArrayVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(errMsg=errMsg, data=json.dumps(self.data), id=id_generator()))
