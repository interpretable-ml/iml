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

type Instance
    x
    groupDisplayValues
    groups::Nullable{Array{Array{Int64,1}}}
end

function Instance(x::Array, groupDisplayValues::Vector)
    Instance(x, groupDisplayValues, Nullable{Array{Array{Int64,1}}}())
end

type Explanation
    baseValue
    effects
    effectsVar
    instance::Instance
    link::Link
    model::Model
    data::Data
end


abstract Explainer

include("explainers/random.jl")
include("explainers/eslime.jl")

# load the visualizers and dump our JS code to the notebook (if present)
include("visualizers.jl")
bundlePath = joinpath(dirname(@__FILE__), "..", "js", "bundle.js")
function __init__()
    isdefined(:IJulia) && display(HTML("<script>$(readstring(bundlePath))</script>"))
end

explain(instance, model, data) = explain(instance, model, data, ESLimeExplainer())
explain(instance, model, data::DataFrames.DataFrame, e::Explainer) = explain(instance, model, DenseData(data), e)
explain(instance, model, data::Matrix, e::Explainer) = explain(instance, model, DenseData([string(i) for i in 1:size(data)[2]], data), e)
explain(x::Array, model, data::Data, e::Explainer) = explain(Instance(x, [length(data.groups[i]) == 1 ? x[data.groups[i][1]] : nothing for i in 1:length(data.groups)], data.groups), model, data::Data, e::Explainer)
explain(instance::Instance, f::Function, data::Data, e::Explainer) = explain(instance, Model(f, ["" for i in 1:length(f(instance.x))]), data, e)

# explain(model, data) = explain(model, data, ESLimeExplainer())
# explain(model, data::DataFrames.DataFrame, e::Explainer) = explain(model, DenseData(data), e)
# explain(model, data::Matrix, e::Explainer) = explain(model, DenseData([string(i) for i in 1:size(data)[2]], data), e)
# function explain(f::Function, data::Data, e::Explainer)
#     x = data.transposed ? data.data[:,[1]] : data.data[[1],:]
#     explain(Model(f, ["" for i in 1:length(f(x))]), data, e)
# end

end
