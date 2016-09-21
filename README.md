<p align="center">
  <img src="https://interpretable-ml.github.io/images/diagramSmall.png" />
</p>

---

**Interpretable ML (iML)** explains outputs from any model, regardless of how complex that model may be. The iML package contains a single function, `explain`, which produces an `Explanation` object that can be inspected or visualized in a Jupyter notebook:

```python
explain(x, f, data) # explain f(x) using a reference sample population 'data'
```
<p align="center">
  <img src="https://interpretable-ml.github.io/images/sampleExplanation.png" />
</p>

By explaining many predictions at once you can gain an intuition of how the model behaves across an entire dataset:
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
