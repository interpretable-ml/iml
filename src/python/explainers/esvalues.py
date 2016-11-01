import esvalues
from numpy import random
from ..common import get_instance_object, get_model_object
from ..explanations import AdditiveExplanation
from ..links import get_link_object, IdentityLink
from ..datatypes import get_data_object

class ESExplainer:
    def __init__(self, model, data, link=IdentityLink(), **kwargs):
        self.link = get_link_object(link)
        self.model = get_model_object(model)
        self.data = get_data_object(data)
        self.estimator = esvalues.ESValuesEstimator(self.model.f, self.data.data, self.link.f, **kwargs)

    def explain(self, instance):
        iobj = get_instance_object(instance)
        fnull,phi,phiVar = self.estimator.esvalues(iobj.x)
        return AdditiveExplanation(fnull, phi, phiVar, iobj, self.link, self.model, self.data)
