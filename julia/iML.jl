module IML

import StatsBase: logit, logistic
import DataFrames
import Base: convert

export
    explain,
    visualize,
    RandomExplainer,
    ESLimeExplainer

include("datatypes.jl")

type Model
    f::Function
    outNames
end

abstract Link

type LogitLink <: Link
    f::Function
    finv::Function
end
LogitLink() = LogitLink(logit, logistic)
convert(::Type{String}, x::LogitLink) = "logit"

type IdentityLink <: Link
    f::Function
    finv::Function
end
IdentityLink() = IdentityLink(identity, identity)
convert(::Type{String}, x::IdentityLink) = "identity"

function convert(::Type{Link}, x::Symbol)
    if x == :logit
        return LogitLink()
    elseif x == :identity
        return IdentityLink()
    else
        throw(Exception("Can't convert $x to a Link object! It is not a known link function."))
    end
end


type Explanation
    baseValue
    effects
    effectsVar
    x
    link::Link
    model::Model
    data::Data
end
#Explanation(baseValue, effects, )


abstract Explainer

include("explainers/random.jl")
include("explainers/eslime.jl")

# load the visualizers and dump our JS code to the notebook (if present)
include("visualizers.jl")
bundlePath = joinpath(dirname(@__FILE__), "..", "js", "bundle.js")
function __init__()
    isdefined(:IJulia) && display(HTML("<script>$(readstring(bundlePath))</script>"))
end

explain(x, model, data) = explain(x, model, data, ESLimeExplainer())
explain(x, f::Function, data, e::Explainer) = explain(x, Model(f, ["" for i in 1:length(f(x))]), data, e)
explain(x, model::Model, data::DataFrames.DataFrame, e::Explainer) = explain(x, model, DenseData(data), e)
explain(x, model::Model, data::Matrix, e::Explainer) = explain(x, model, DenseData([string(i) for i in 1:size(data)[2]], data), e)

explain(model, data) = explain(model, data, ESLimeExplainer())
explain(model, data::DataFrames.DataFrame, e::Explainer) = explain(model, DenseData(data), e)
explain(model, data::Matrix, e::Explainer) = explain(model, DenseData([string(i) for i in 1:size(data)[2]], data), e)
function explain(f::Function, data::Data, e::Explainer)
    x = data.transposed ? data.data[:,[1]] : data.data[[1],:]
    explain(Model(f, ["" for i in 1:length(f(x))]), data, e)
end

end
