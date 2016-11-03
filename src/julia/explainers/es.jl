import ESValues

type ESExplainer <: Explainer
    model::Model
    data::Data
    link::Link
    nsamples::Int64
    explain::Function
end
ESExplainer(model, data) = ESExplainer(model, data, IdentityLink())
ESExplainer(model, data, link) = ESExplainer(model, data, link, 0)
function ESExplainer(model, data, link, nsamples)
    e = ESExplainer(convert(Model, model), convert(Data, data), convert(Link, link), nsamples, x->x)
    match_data!(e.model, e.data)
    e.explain = x->explain(convert(Instance, x), e)
    e
end

function explain(instance::Instance, e::ESExplainer)
    local fx

    # make sure the instance is compatible with the background data
    match_data!(instance, e.data)

    # make sure the functions we got from the user actually work
    try
        e.model.f(e.data.data)
    catch err
        error("Provided model function fails when applied to the provided data set: ", err)
    end
    try
        fx = e.model.f(instance.x)
        length(fx) == 1 || throw(Exception("Length of model.f(x) should be 1"))
    catch err
        error("Provided model function fails when applied to the provided data instance x: ", err)
    end

    baseValue,effects,effectsVar = ESValues.esvalues(
        e.data.transposed ? instance.x : instance.x',
        e.data.transposed ? e.model.f : x->e.model.f(x'),
        e.data.transposed ? e.data.data : e.data.data',
        e.link.f;
        featureGroups=e.data.groups,
        weights=e.data.weights,
        nsamples=e.nsamples
    )
    AdditiveExplanation(e.link.f(baseValue), fx, effects, effectsVar, instance, e.link, e.model, e.data)
end

# function explain(model::Model, data::Data, e::ESExplainer)
#     if data.transposed
#         return Explanation[explain(data.data[:,[i]], model::Model, data::Data, e::ESExplainer) for i in 1:size(data.data)[2]]
#     else
#         return Explanation[explain(data.data[[i],:], model::Model, data::Data, e::ESExplainer) for i in 1:size(data.data)[1]]
#     end
# end
