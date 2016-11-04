from .datatypes import DenseData


class Instance:
    def __init__(self, x, groupDisplayValues):
        self.x = x
        self.groupDisplayValues = groupDisplayValues


def convert_to_instance(val):
    if isinstance(val, Instance):
        return val
    else:
        return Instance(val, None)


def match_instance_to_data(instance, data):
    assert isinstance(instance, Instance), "instance must be of type Instance!"

    if isinstance(data, DenseData):
        if instance.groupDisplayValues is None:
            instance.groupDisplayValues = [instance.x[0, group[0]] if len(group) == 1 else "" for group in data.groups]
        assert len(instance.groupDisplayValues) == len(data.groups)
        instance.groups = data.groups


class Model:
    def __init__(self, f, outNames):
        self.f = f
        self.outNames = outNames


def convert_to_model(val):
    if isinstance(val, Model):
        return val
    else:
        return Model(val, None)


def match_model_to_data(model, data):
    assert isinstance(model, Model), "model must be of type Model!"

    if isinstance(data, DenseData):
        outVal = None
        try:
            outVal = model.f(data.data)
        except:
            print("Provided model function fails when applied to the provided data set.")
            raise

        if model.outNames is None:
            if len(outVal.shape) == 1:
                model.outNames = [""]
            else:
                model.outNames = ["" for i in range(outVal.shape[0])]
