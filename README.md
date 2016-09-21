# iML

Interpretable ML is a project aimed at allowing predictions from any model to explained, regardless of how complex that model may be. The iML package is the project's primary collection of tools for explaining model predictions. A single function is exported:

```python
explain(x, f, data)
```

which produces an explanation that can be visualized in a Jupyter notebook.



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
