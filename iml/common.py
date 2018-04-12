from .datatypes import DenseData, DenseDataWithIndex
import re
import pandas as pd

class Instance:
    def __init__(self, x, group_display_values):
        self.x = x
        self.group_display_values = group_display_values


def convert_to_instance(val):
    if isinstance(val, Instance):
        return val
    else:
        return Instance(val, None)


class InstanceWithIndex(Instance):
    def __init__(self, x, column_name, index_value, index_name, group_display_values):
        Instance.__init__(self, x, group_display_values)
        self.index_value = index_value
        self.index_name = index_name
        self.column_name = column_name

    def convert_to_df(self):
        index = pd.DataFrame(self.index_value, columns=[self.index_name])
        data = pd.DataFrame(self.x, columns=self.column_name)
        df = pd.concat([index, data], axis=1)
        df = df.set_index(self.index_name)
        return df


def convert_to_instance_with_index(val, column_name, index_value, index_name):
    return InstanceWithIndex(val, column_name, index_value, index_name, None)


def match_instance_to_data(instance, data):
    assert isinstance(instance, Instance), "instance must be of type Instance!"

    if isinstance(data, DenseData):
        if instance.group_display_values is None:
            instance.group_display_values = [instance.x[0, group[0]] if len(group) == 1 else "" for group in data.groups]
        assert len(instance.group_display_values) == len(data.groups)
        instance.groups = data.groups


class Model:
    def __init__(self, f, out_names):
        self.f = f
        self.out_names = out_names


def convert_to_model(val):
    if isinstance(val, Model):
        return val
    else:
        return Model(val, None)


def match_model_to_data(model, data):
    assert isinstance(model, Model), "model must be of type Model!"

    if isinstance(data, DenseData):
        try:
            if isinstance(data, DenseDataWithIndex):
                out_val = model.f(data.convert_to_df())
            else:
                out_val = model.f(data.data)
        except:
            print("Provided model function fails when applied to the provided data set.")
            raise

        if model.out_names is None:
            if len(out_val.shape) == 1:
                model.out_names = ["output value"]
            else:
                model.out_names = ["output value "+str(i) for i in range(out_val.shape[0])]

def verify_valid_cmap(cmap):
    assert (isinstance(cmap,str)
                or isinstance(cmap,list)
     ),"Plot color map must be string or list!"
    if isinstance(cmap,list):
        assert (len(cmap) > 1),"Color map must be at least two colors."
        _rgbstring = re.compile(r'#[a-fA-F0-9]{6}$')
        for color in cmap:
             assert(bool(_rgbstring.match(color))),"Invalid color found in CMAP."

    return cmap
