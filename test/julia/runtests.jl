using IML

X = randn(2,10)
x = randn(1,10)
f = x->sum(x,2)
f(X)

e = ESValuesExplainer(f, X).explain(x)
