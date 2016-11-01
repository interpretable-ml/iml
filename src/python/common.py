
class Instance:
    def __init__(self, x, groupDisplayValues):
        self.x = x
        self.groupDisplayValues = groupDisplayValues


def get_instance_object(val):
    if isinstance(val, Instance):
        return val
    else:
        return Instance(val, None)


class Model:
    def __init__(self, f, outNames):
        self.f = f
        self.outNames = outNames


def get_model_object(val):
    if isinstance(val, Model):
        return val
    else:
        return Model(val, None)
