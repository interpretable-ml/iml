from .common import Model
from .common import Instance
from .common import Plot_CMAP
from .datatypes import Data
from .links import Link

class Explanation:
    def __init__(self):
        pass


class AdditiveExplanation(Explanation):
    def __init__(self, base_value, out_value, effects, effects_var, instance, link, model, data,plot_cmap):
        self.base_value = base_value
        self.out_value = out_value
        self.effects = effects
        self.effects_var = effects_var
        assert isinstance(instance, Instance)
        self.instance = instance
        assert isinstance(link, Link)
        self.link = link
        assert isinstance(model, Model)
        self.model = model
        assert isinstance(data, Data)
        self.data = data
        assert isinstance(plot_cmap,Plot_CMAP)
        self.plot_cmap = plot_cmap

    # def _rdepr_pretty_(self, pp, cycle):
    #     print(pp)
    #     return visualizers.visualize(self)
