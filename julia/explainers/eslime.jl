import ShapleyValues

type ESLimeExplainer <: Explainer
    link::Link
    nsamples
end
ESLimeExplainer() = ESLimeExplainer(IdentityLink(), nothing)
ESLimeExplainer(link::Link) = ESLimeExplainer(link, nothing)
ESLimeExplainer(link::Symbol) = ESLimeExplainer(convert(Link, link), nothing)

function explain(x, model::Model, data::Data, e::ESLimeExplainer)

    # make sure the functions we got from the user actually work
    try
        model.f(data.data)
    catch e
        error("Provided model function fails when applied to the provided data set: ", e)
    end
    try
        length(model.f(x)) == 1 || throw(Exception("Length of model.f(x) should be 1"))
    catch e
        error("Provided model function fails when applied to the provided data instance x: ", e)
    end

    baseValue,effects,effectsVar = ShapleyValues.shapleyvalues(
        data.transposed ? x : x',
        data.transposed ? model.f : x->model.f(x'),
        data.transposed ? data.data : data.data',
        e.link.f;
        featureGroups=data.groups,
        weights=data.weights,
        nsamples=e.nsamples
    )
    Explanation(e.link.f(baseValue), effects, effectsVar, x, e.link, model, data)
end

function explain(model::Model, data::Data, e::ESLimeExplainer)
    if data.transposed
        return Explanation[explain(data.data[:,[i]], model::Model, data::Data, e::ESLimeExplainer) for i in 1:size(data.data)[2]]
    else
        return Explanation[explain(data.data[[i],:], model::Model, data::Data, e::ESLimeExplainer) for i in 1:size(data.data)[1]]
    end
end
