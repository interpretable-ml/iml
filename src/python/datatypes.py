import numpy as np


class Data:
    def __init__(self):
        pass


class DenseData(Data):
    def __init__(self, groupNames, data, *args):
        l = len(groupNames)
        numSamples = data.shape[0]
        t = False
        if l != data.shape[1]:
            t = True
            numSamples = data.shape[1]

        valid = (not t and l == data.shape[1]) or (t and l == data.shape[0])
        assert valid, "# of names must match data matrix!"

        self.weights = args[0] if len(args) > 0 else np.ones(numSamples)
        wl = len(self.weights)
        valid = (not t and wl == data.shape[0]) or (t and wl == data.shape[1])
        assert valid, "# weights must match data matrix!"

        self.transposed = t
        self.groupNames = groupNames
        self.data = data
        self.groups = args[1] if len(args) > 1 else [np.array([i]) for i in range(l)]


def convert_to_data(val):
    if isinstance(val, Data):
        return val
    elif type(val) == np.ndarray:
        return DenseData([str(i) for i in range(val.shape[1])], val)
    else:
        assert False, "Unknown type passed as data object: "+str(type(val))
