type RandomExplainer <: Explainer
end
function explain(x, f::Model, data::Data, e::RandomExplainer)
    Explanation(randn(length(x)), f, data)
    Explanation(0, randn(length(x)), ones(length(x)), x, IdentityLink(), model, data)
end
