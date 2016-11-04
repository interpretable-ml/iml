from .common import Model
from .common import Instance
from .datatypes import Data
from .links import Link


class Explanation:
    def __init__(self):
        pass


class AdditiveExplanation(Explanation):
    def __init__(self, baseValue, effects, effectsVar, instance, link, model, data):
        self.baseValue = baseValue
        self.effects = effects
        self.effectsVar = effectsVar
        assert isinstance(instance, Instance)
        self.instance = instance
        assert isinstance(link, Link)
        self.link = link
        assert isinstance(model, Model)
        self.model = model
        assert isinstance(data, Data)
        self.data = data
