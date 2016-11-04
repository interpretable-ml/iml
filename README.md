<p align="center">
  <img src="https://interpretable-ml.github.io/images/LogoIntegrated.png" />
</p>

---

**Interpretable ML (iML)** explains the output of any model, regardless of the model's complexity. Different approaches to explaining models are implemented as different `Explainer` objects. After wrapping your model, `f`, in an iML `Explainer` any model prediction `f(x)` can be explained as an `Explanation` object that can be inspected or visualized in a Jupyter notebook:

```python
e = ESExplainer(f, data).explain(x) # explain f(x) using a reference sample population 'data'
visualize(e)
```
<p align="center">
  <img src="https://interpretable-ml.github.io/images/sampleExplanation.png" />
</p>

By explaining many predictions at once you can gain an intuition of how the model behaves across an entire dataset:
```python
ex = ESExplainer(f, data)
visualize([ex.explain(data[i,:]) for i in range(size(data)[1])])
```
<p align="center">
  <img src="https://interpretable-ml.github.io/images/sampleModelExplanation.png" />
</p>

## Getting started

### Python

```python
pip install iml
```

```python
import ESExplainer from iml
iml.initjs()

ESExplainer(f, data).explain(x)
```

### Julia
```julia
Pkg.add("IML")
```

```julia
using IML
IML.initjs()

ESExplainer(f, data).explain(x)
```
