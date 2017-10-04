import esvalues
from ..common import convert_to_instance, convert_to_model, match_instance_to_data, match_model_to_data
from ..explanations import AdditiveExplanation
from ..links import convert_to_link, IdentityLink
from ..datatypes import convert_to_data


class ESExplainer:
    def __init__(self, model, data, link=IdentityLink(), **kwargs):
        self.link = convert_to_link(link)
        self.model = convert_to_model(model)
        self.data = convert_to_data(data)
        match_model_to_data(self.model, self.data)
        self.estimator = esvalues.ESValuesEstimator(self.model.f, self.data.data, self.link.f, **kwargs)

    def explain(self, instance):
        iobj = convert_to_instance(instance)
        match_instance_to_data(iobj, self.data)
        fnull, phi, phiVar = self.estimator.esvalues(iobj.x)
        return AdditiveExplanation(fnull, phi, phiVar, iobj, self.link, self.model, self.data)
