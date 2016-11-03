import os
import string
import json
import random
from IPython.core.display import display, HTML
import base64
from .explanations import Explanation, AdditiveExplanation

errMsg = """
<div style='color: #900; text-align: center;'>
  <b>Visualization omitted, iML Javascript library not loaded!</b><br>
  Have you run `IML.initjs()` in this notebook? If this notebook was from another
  user you must also trust this notebook (File -> Trust notebook).
</div>"""


def initjs():
    bundlePath = os.path.join(os.path.split(__file__)[0], "..", "javascript", "build", "bundle.js")
    bundleData = open(bundlePath, "r").read()
    logoPath = os.path.join(os.path.split(__file__)[0], "..", "javascript", "build", "logoSmallGray.png")
    logoData = base64.b64encode(open(logoPath, "rb").read()).decode('ascii')
    return HTML(
        "<div align='center'><img src='data:image/png;base64,{logoData}' /></div>".format(logoData=logoData) +
        "<script>{bundleData}</script>".format(bundleData=bundleData)
    )


def id_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return "i"+''.join(random.choice(chars) for _ in range(size))


def visualize(e):
    assert isinstance(e, Explanation), "visualize can only display Explanation objects!"

    if isinstance(e, AdditiveExplanation):
        return AdditiveForceVisualizer(e).html()
    else:
        return SimpleListVisualizer(e).html()


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
            "baseValue": e.baseValue,
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
        assert isinstance(e, AdditiveExplanation), "AdditiveForceVisualizer can only visualize AdditiveExplanation objects!"

        # build the json data
        features = {}
        for i in filter(lambda j: e.effects[j] != 0, range(len(e.data.groupNames))):
            features[i] = {
                "effect": e.effects[i],
                "value": e.instance.groupDisplayValues[i]
            }
        self.data = {
            "outNames": e.model.outNames,
            "baseValue": e.baseValue,
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
