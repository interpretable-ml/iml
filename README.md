<p align="center">
  <img src="https://interpretable-ml.github.io/images/diagramSmall.png" />
</p>

---

**Interpretable ML** is a project aimed at allowing predictions from any model to explained, regardless of how complex that model may be. The iML package is the project's primary collection of tools for explaining model predictions. A single function is exported which produces an explanation that can be visualized in a Jupyter notebook:

```python
explain(x, f, data) # explain f(x) using a reference sample population 'data'
```
<p align="center">
  <img src="https://interpretable-ml.github.io/images/sampleExplanation.png" />
</p>

By explaining many predictions at you can gain an intuition of how the model behaves.
```python
[explain(data[i,:], f, data) for i in range(size(data)[1])]
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
import explain from iml

explain(x, f, data)
```

### Julia
```julia
Pkg.add("IML")
```

```julia
using IML

explain(x, f, data)
```
