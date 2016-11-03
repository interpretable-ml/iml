import StatsBase: logit, logistic
import Base: convert

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
