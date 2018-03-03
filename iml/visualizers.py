from __future__ import unicode_literals
import os
import io
import string
import json
import random
from IPython.core.display import display, HTML
import base64
import numpy as np
import scipy.cluster
from .explanations import Explanation, AdditiveExplanation
import collections
from .common import verify_valid_cmap


err_msg = """
<div style='color: #900; text-align: center;'>
  <b>Visualization omitted, Javascript library not loaded!</b><br>
  Have you run `initjs()` in this notebook? If this notebook was from another
  user you must also trust this notebook (File -> Trust notebook). If you are viewing
  this notebook on github the Javascript has been stripped for security.
</div>"""


def initjs():
    bundle_path = os.path.join(os.path.split(__file__)[0], "resources", "bundle.js")
    bundle_data = io.open(bundle_path, encoding="utf-8").read()
    logo_path = os.path.join(os.path.split(__file__)[0], "resources", "logoSmallGray.png")
    logo_data = base64.b64encode(open(logo_path, "rb").read()).decode('utf-8')
    display(HTML(
        "<div align='center'><img src='data:image/png;base64,{logo_data}' /></div>".format(logo_data=logo_data) +
        "<script>{bundle_data}</script>".format(bundle_data=bundle_data)
    ))


def id_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return "i"+''.join(random.choice(chars) for _ in range(size))


def ensure_not_numpy(x):
    if isinstance(x, bytes):
        return x.decode()
    elif isinstance(x, np.str):
        return str(x)
    elif isinstance(x, np.generic):
        return float(np.asscalar(x))
    else:
        return x


def visualize(e, plot_cmap="RdBu"):
    plot_cmap = verify_valid_cmap(plot_cmap)
    if isinstance(e, AdditiveExplanation):
        return AdditiveForceVisualizer(e, plot_cmap=plot_cmap).html()
    elif isinstance(e, Explanation):
        return SimpleListVisualizer(e).html()
    elif isinstance(e, collections.Sequence) and len(e) > 0 and isinstance(e[0], AdditiveExplanation):
        return AdditiveForceArrayVisualizer(e, plot_cmap=plot_cmap).html()
    else:
        assert False, "visualize() can only display Explanation objects (or arrays of them)!"

try:
    # register the visualize function with IPython
    ip = get_ipython()
    svg_formatter=ip.display_formatter.formatters['text/html']
    svg_formatter.for_type(Explanation, lambda x: visualize(x).data)
    old_list_formatter = svg_formatter.for_type(list)
    def try_list_display(e):
        if isinstance(e, collections.Sequence) and len(e) > 0 and isinstance(e[0], AdditiveExplanation):
            return visualize(e).data
        else:
            return str(e) if old_list_formatter is None else old_list_formatter(e)
    svg_formatter.for_type(list, try_list_display)
except:
    pass

class SimpleListVisualizer:
    def __init__(self, e):
        assert isinstance(e, Explanation), "SimpleListVisualizer can only visualize Explanation objects!"

        # build the json data
        features = {}
        for i in filter(lambda j: e.effects[j] != 0, range(len(e.data.group_names))):
            features[i] = {
                "effect": e.effects[i],
                "value": e.instance.group_display_values[i]
            }
        self.data = {
            "outNames": e.model.out_names,
            "base_value": e.base_value,
            "link": str(e.link),
            "featureNames": e.data.group_names,
            "features": features,
            "plot_cmap":e.plot_cmap.plot_cmap
        }

    def html(self):
        return HTML("""
<div id='{id}'>{err_msg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.SimpleListVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(err_msg=err_msg, data=json.dumps(self.data), id=id_generator()))


class AdditiveForceVisualizer:
    def __init__(self, e, plot_cmap="RdBu"):
        assert isinstance(e, AdditiveExplanation), \
            "AdditiveForceVisualizer can only visualize AdditiveExplanation objects!"

        # build the json data
        features = {}
        for i in filter(lambda j: e.effects[j] != 0, range(len(e.data.group_names))):
            features[i] = {
                "effect": ensure_not_numpy(e.effects[i]),
                "value": ensure_not_numpy(e.instance.group_display_values[i])
            }
        self.data = {
            "outNames": e.model.out_names,
            "baseValue": ensure_not_numpy(e.base_value),
            "outValue": ensure_not_numpy(e.out_value),
            "link": str(e.link),
            "featureNames": e.data.group_names,
            "features": features,
            "plot_cmap": plot_cmap
        }

    def html(self, label_margin=20):
        self.data["labelMargin"] = label_margin
        return HTML("""
<div id='{id}'>{err_msg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(err_msg=err_msg, data=json.dumps(self.data), id=id_generator()))


class AdditiveForceArrayVisualizer:
    def __init__(self, arr, plot_cmap="RdBu"):
        assert isinstance(arr[0], AdditiveExplanation), \
            "AdditiveForceArrayVisualizer can only visualize arrays of AdditiveExplanation objects!"

        # order the samples by their position in a hierarchical clustering
        if all([e.model.f == arr[1].model.f for e in arr]):
            #m = np.vstack([e.effects for e in arr])
            D = scipy.spatial.distance.pdist(np.vstack([e.effects for e in arr]), 'sqeuclidean')
            #D = np.vstack([np.sum((m - m[i,:])**2, 1) for i in range(m.shape[0])])
            clustOrder = scipy.cluster.hierarchy.leaves_list(scipy.cluster.hierarchy.complete(D))
        else:
            assert False, "Tried to visualize an array of explanations from different models!"

        # make sure that we put the higher predictions first...just for consistency
        if sum(arr[clustOrder[0]].effects) < sum(arr[clustOrder[-1]].effects):
            np.flipud(clustOrder) # reverse

        # build the json data
        clustOrder = np.argsort(clustOrder) # inverse permutation
        self.data = {
            "outNames": arr[0].model.out_names,
            "baseValue": ensure_not_numpy(arr[0].base_value),
            "link": arr[0].link.__str__(),
            "featureNames": arr[0].data.group_names,
            "explanations": [],
            "plot_cmap": plot_cmap
        }
        for (ind,e) in enumerate(arr):
            self.data["explanations"].append({
                "outValue": ensure_not_numpy(e.out_value),
                "simIndex": ensure_not_numpy(clustOrder[ind])+1,
                "features": {}
            })
            for i in filter(lambda j: e.effects[j] != 0 or e.instance.x[0,j] != 0, range(len(e.data.group_names))):
                self.data["explanations"][-1]["features"][i] = {
                    "effect": ensure_not_numpy(e.effects[i]),
                    "value": ensure_not_numpy(e.instance.group_display_values[i])
                }

    def html(self):
        return HTML("""
<div id='{id}'>{err_msg}</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceArrayVisualizer, {data}),
    document.getElementById('{id}')
  );
</script>""".format(err_msg=err_msg, data=json.dumps(self.data), id=id_generator()))
