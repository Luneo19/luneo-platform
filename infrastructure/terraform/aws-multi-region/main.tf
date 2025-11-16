terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.39"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
  }

  backend "s3" {
    bucket         = "luneo-terraform-state"
    key            = "global/multi-region/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "luneo-terraform-locks"
    encrypt        = true
  }
}

locals {
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    Provisioner = "AWS"
  }

  primary_azs   = slice(data.aws_availability_zones.primary.names, 0, var.primary_az_count)
  secondary_azs = slice(data.aws_availability_zones.secondary.names, 0, var.secondary_az_count)

  primary_private_subnets = [
    for index in range(length(local.primary_azs)) :
    cidrsubnet(var.vpc_primary_cidr, 4, index)
  ]

  primary_public_subnets = [
    for index in range(length(local.primary_azs)) :
    cidrsubnet(var.vpc_primary_cidr, 4, index + 8)
  ]

  secondary_private_subnets = [
    for index in range(length(local.secondary_azs)) :
    cidrsubnet(var.vpc_secondary_cidr, 4, index)
  ]

  secondary_public_subnets = [
    for index in range(length(local.secondary_azs)) :
    cidrsubnet(var.vpc_secondary_cidr, 4, index + 8)
  ]
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = local.tags
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = local.tags
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = merge(local.tags, { Region = var.secondary_region })
  }
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

module "vpc_primary" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.1"

  providers = {
    aws = aws.primary
  }

  name = "${var.project}-${var.environment}-primary"
  cidr = var.vpc_primary_cidr

  azs             = local.primary_azs
  private_subnets = local.primary_private_subnets
  public_subnets  = local.primary_public_subnets

  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_nat_gateway = true
  single_nat_gateway = false

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = merge(local.tags, {
    Region = var.primary_region
    Scope  = "primary"
  })
}

module "vpc_secondary" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.1"

  providers = {
    aws = aws.secondary
  }

  name = "${var.project}-${var.environment}-secondary"
  cidr = var.vpc_secondary_cidr

  azs             = local.secondary_azs
  private_subnets = local.secondary_private_subnets
  public_subnets  = local.secondary_public_subnets

  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_nat_gateway = true
  single_nat_gateway = false

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = merge(local.tags, {
    Region = var.secondary_region
    Scope  = "secondary"
  })
}

module "eks_primary" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"

  providers = {
    aws = aws.primary
  }

  cluster_name    = "${var.project}-${var.environment}-eks-primary"
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  enable_irsa                     = true

  vpc_id     = module.vpc_primary.vpc_id
  subnet_ids = module.vpc_primary.private_subnets

  eks_managed_node_groups = {
    primary = {
      instance_types = var.eks_primary_instance_types
      capacity_type  = "ON_DEMAND"
      min_size       = var.eks_primary_min_size
      max_size       = var.eks_primary_max_size
      desired_size   = var.eks_primary_desired_size
      labels = {
        lifecycle = "on-demand"
        region    = var.primary_region
      }
      tags = merge(local.tags, {
        NodePool = "primary"
      })
    }
    primary_spot = {
      instance_types = var.eks_primary_spot_instance_types
      capacity_type  = "SPOT"
      min_size       = var.eks_primary_spot_min_size
      max_size       = var.eks_primary_spot_max_size
      desired_size   = var.eks_primary_spot_desired_size
      labels = {
        lifecycle = "spot"
        region    = var.primary_region
      }
      taints = [
        {
          key    = "spotInstance"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
      tags = merge(local.tags, {
        NodePool = "primary-spot"
      })
    }
  }

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent              = true
      resolve_conflicts        = "OVERWRITE"
      before_compute           = false
      service_account_role_arn = null
    }
  }

  tags = merge(local.tags, {
    Region = var.primary_region
  })
}

module "eks_secondary" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8"

  providers = {
    aws = aws.secondary
  }

  cluster_name    = "${var.project}-${var.environment}-eks-secondary"
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  enable_irsa                     = true

  vpc_id     = module.vpc_secondary.vpc_id
  subnet_ids = module.vpc_secondary.private_subnets

  eks_managed_node_groups = {
    secondary = {
      instance_types = var.eks_secondary_instance_types
      capacity_type  = "ON_DEMAND"
      min_size       = var.eks_secondary_min_size
      max_size       = var.eks_secondary_max_size
      desired_size   = var.eks_secondary_desired_size
      labels = {
        lifecycle = "on-demand"
        region    = var.secondary_region
      }
      tags = merge(local.tags, {
        NodePool = "secondary"
      })
    }
    secondary_spot = {
      instance_types = var.eks_secondary_spot_instance_types
      capacity_type  = "SPOT"
      min_size       = var.eks_secondary_spot_min_size
      max_size       = var.eks_secondary_spot_max_size
      desired_size   = var.eks_secondary_spot_desired_size
      labels = {
        lifecycle = "spot"
        region    = var.secondary_region
      }
      taints = [
        {
          key    = "spotInstance"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
      tags = merge(local.tags, {
        NodePool = "secondary-spot"
      })
    }
  }

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent       = true
      resolve_conflicts = "OVERWRITE"
    }
  }

  tags = merge(local.tags, {
    Region = var.secondary_region
  })
}

provider "kubernetes" {
  alias                  = "primary"
  host                   = module.eks_primary.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_primary.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--region", var.primary_region, "--cluster-name", module.eks_primary.cluster_name]
  }
}

# Configmap aws-auth pour permettre l'accès IAM au cluster EKS primary
# Le configmap est créé automatiquement par le module EKS
# On utilise null_resource pour l'ajouter via AWS CLI car Terraform n'a pas encore accès
resource "null_resource" "aws_auth_primary" {
  count = var.create_kubernetes_resources ? 1 : 0
  depends_on = [module.eks_primary]

  provisioner "local-exec" {
    command = <<-EOT
      aws eks update-kubeconfig --region ${var.primary_region} --name ${module.eks_primary.cluster_name} || true
      # Attendre que le configmap existe (créé par le module EKS)
      sleep 10
      # Essayer d'ajouter l'utilisateur au configmap (peut échouer si kubectl n'est pas installé, c'est OK)
      kubectl patch configmap aws-auth -n kube-system \
        --context "arn:aws:eks:${var.primary_region}:115849270532:cluster/${module.eks_primary.cluster_name}" \
        --type merge \
        -p '{"data":{"mapUsers":"- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"}}' 2>/dev/null || echo "kubectl non disponible, configmap à créer manuellement"
    EOT
  }

  triggers = {
    cluster_name = module.eks_primary.cluster_name
  }
}

provider "kubernetes" {
  alias                  = "secondary"
  host                   = module.eks_secondary.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_secondary.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--region", var.secondary_region, "--cluster-name", module.eks_secondary.cluster_name]
  }
}

# Configmap aws-auth pour permettre l'accès IAM au cluster EKS secondary
# Le configmap est créé automatiquement par le module EKS
# On utilise null_resource pour l'ajouter via AWS CLI car Terraform n'a pas encore accès
resource "null_resource" "aws_auth_secondary" {
  count = var.create_kubernetes_resources ? 1 : 0
  depends_on = [module.eks_secondary]

  provisioner "local-exec" {
    command = <<-EOT
      aws eks update-kubeconfig --region ${var.secondary_region} --name ${module.eks_secondary.cluster_name} || true
      # Attendre que le configmap existe (créé par le module EKS)
      sleep 10
      # Essayer d'ajouter l'utilisateur au configmap (peut échouer si kubectl n'est pas installé, c'est OK)
      kubectl patch configmap aws-auth -n kube-system \
        --context "arn:aws:eks:${var.secondary_region}:115849270532:cluster/${module.eks_secondary.cluster_name}" \
        --type merge \
        -p '{"data":{"mapUsers":"- userarn: arn:aws:iam::115849270532:user/191197Em.\n  username: 191197Em.\n  groups:\n  - system:masters\n"}}' 2>/dev/null || echo "kubectl non disponible, configmap à créer manuellement"
    EOT
  }

  triggers = {
    cluster_name = module.eks_secondary.cluster_name
  }
}

provider "helm" {
  alias = "primary"

  kubernetes {
    host                   = module.eks_primary.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_primary.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--region", var.primary_region, "--cluster-name", module.eks_primary.cluster_name]
    }
  }
}

provider "helm" {
  alias = "secondary"

  kubernetes {
    host                   = module.eks_secondary.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_secondary.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--region", var.secondary_region, "--cluster-name", module.eks_secondary.cluster_name]
    }
  }
}

resource "kubernetes_namespace" "platform" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = kubernetes.primary
  depends_on = [module.eks_primary, null_resource.aws_auth_primary]

  metadata {
    name = "luneo-platform"
    labels = {
      "app.kubernetes.io/part-of" = "luneo"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  lifecycle {
    ignore_changes = [metadata]
  }
}

resource "kubernetes_namespace" "platform_secondary" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = kubernetes.secondary
  depends_on = [module.eks_secondary, null_resource.aws_auth_secondary]

  metadata {
    name = "luneo-platform"
    labels = {
      "app.kubernetes.io/part-of" = "luneo"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  lifecycle {
    ignore_changes = [metadata]
  }
}

# --- AWS Load Balancer Controller (Primary) ---
data "aws_iam_policy_document" "alb_assume_role_primary" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [module.eks_primary.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${module.eks_primary.oidc_provider}:sub"
      values = [
        "system:serviceaccount:kube-system:aws-load-balancer-controller"
      ]
    }
  }
}

resource "aws_iam_role" "alb_controller_primary" {
  provider = aws.primary

  name               = "${var.project}-${var.environment}-alb-controller-primary"
  assume_role_policy = data.aws_iam_policy_document.alb_assume_role_primary.json

  tags = merge(local.tags, {
    Region = var.primary_region
    Role   = "alb-controller"
  })
}

resource "aws_iam_role_policy" "alb_controller_primary" {
  provider = aws.primary
  name     = "AWSLoadBalancerControllerIAMPolicy"
  role     = aws_iam_role.alb_controller_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole",
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeCoipPools",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeSSLPolicies",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPoolClient",
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "iam:ListServerCertificates",
          "iam:GetServerCertificate",
          "waf-regional:GetWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSecurityGroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "CreateSecurityGroup"
          }
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DeleteSecurityGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:SetIpAddressType",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:DeleteTargetGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          StringEquals = {
            "elasticloadbalancing:CreateAction" = [
              "CreateTargetGroup",
              "CreateLoadBalancer"
            ]
          }
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets"
        ]
        Resource = "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddListenerCertificates",
          "elasticloadbalancing:RemoveListenerCertificates",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "kubernetes_service_account" "alb_controller_primary" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = kubernetes.primary
  depends_on = [module.eks_primary, null_resource.aws_auth_primary]

  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.alb_controller_primary.arn
    }
    labels = {
      "app.kubernetes.io/name"       = "aws-load-balancer-controller"
      "app.kubernetes.io/component"  = "controller"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  lifecycle {
    ignore_changes = [metadata]
  }
}

resource "helm_release" "alb_controller_primary" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = helm.primary

  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  create_namespace = false

  values = [
    yamlencode({
      clusterName = module.eks_primary.cluster_name
      region      = var.primary_region
      vpcId       = module.vpc_primary.vpc_id
      serviceAccount = {
        create = false
        name   = kubernetes_service_account.alb_controller_primary[0].metadata[0].name
      }
      enableShield = false
      enableWaf    = false
    })
  ]

  depends_on = [
    kubernetes_service_account.alb_controller_primary
  ]
}

# --- AWS Load Balancer Controller (Secondary) ---
data "aws_iam_policy_document" "alb_assume_role_secondary" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [module.eks_secondary.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${module.eks_secondary.oidc_provider}:sub"
      values = [
        "system:serviceaccount:kube-system:aws-load-balancer-controller"
      ]
    }
  }
}

resource "aws_iam_role" "alb_controller_secondary" {
  provider = aws.secondary

  name               = "${var.project}-${var.environment}-alb-controller-secondary"
  assume_role_policy = data.aws_iam_policy_document.alb_assume_role_secondary.json

  tags = merge(local.tags, {
    Region = var.secondary_region
    Role   = "alb-controller"
  })
}

resource "aws_iam_role_policy" "alb_controller_secondary" {
  provider = aws.secondary
  name     = "AWSLoadBalancerControllerIAMPolicy"
  role     = aws_iam_role.alb_controller_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole",
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeCoipPools",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeSSLPolicies",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPoolClient",
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "iam:ListServerCertificates",
          "iam:GetServerCertificate",
          "waf-regional:GetWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSecurityGroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          StringEquals = {
            "ec2:CreateAction" = "CreateSecurityGroup"
          }
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/*"
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DeleteSecurityGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "true"
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
          "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:SetIpAddressType",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:DeleteTargetGroup"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:AddTags"
        ]
        Resource = [
          "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
          "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
        ]
        Condition = {
          StringEquals = {
            "elasticloadbalancing:CreateAction" = [
              "CreateTargetGroup",
              "CreateLoadBalancer"
            ]
          }
          Null = {
            "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets"
        ]
        Resource = "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddListenerCertificates",
          "elasticloadbalancing:RemoveListenerCertificates",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "kubernetes_service_account" "alb_controller_secondary" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = kubernetes.secondary
  depends_on = [module.eks_secondary, null_resource.aws_auth_secondary]

  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.alb_controller_secondary.arn
    }
    labels = {
      "app.kubernetes.io/name"       = "aws-load-balancer-controller"
      "app.kubernetes.io/component"  = "controller"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  lifecycle {
    ignore_changes = [metadata]
  }
}

resource "helm_release" "alb_controller_secondary" {
  count    = var.create_kubernetes_resources ? 1 : 0
  provider = helm.secondary

  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  create_namespace = false

  values = [
    yamlencode({
      clusterName = module.eks_secondary.cluster_name
      region      = var.secondary_region
      vpcId       = module.vpc_secondary.vpc_id
      serviceAccount = {
        create = false
        name   = kubernetes_service_account.alb_controller_secondary[0].metadata[0].name
      }
      enableShield = false
      enableWaf    = false
    })
  ]

  depends_on = [
    kubernetes_service_account.alb_controller_secondary
  ]
}

# --- Aurora Global Database ---
resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.project}-${var.environment}-primary-db-subnet"
  subnet_ids = module.vpc_primary.private_subnets

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "primary"
  })
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary

  name       = "${var.project}-${var.environment}-secondary-db-subnet"
  subnet_ids = module.vpc_secondary.private_subnets

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "secondary"
  })
}

resource "aws_security_group" "aurora_primary" {
  provider = aws.primary

  name        = "${var.project}-${var.environment}-aurora-primary-sg"
  description = "Aurora PostgreSQL - access from EKS clusters"
  vpc_id      = module.vpc_primary.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc_primary.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "primary"
  })
}

resource "aws_security_group" "aurora_secondary" {
  provider = aws.secondary

  name        = "${var.project}-${var.environment}-aurora-secondary-sg"
  description = "Aurora PostgreSQL - read-only secondary region"
  vpc_id      = module.vpc_secondary.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc_secondary.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "secondary"
  })
}

resource "aws_kms_key" "aurora" {
  provider = aws.primary

  description         = "KMS key for Aurora global cluster"
  enable_key_rotation = true

  tags = merge(local.tags, {
    Component = "database"
  })
}

resource "aws_kms_key_policy" "aurora" {
  provider = aws.primary
  key_id   = aws_kms_key.aurora.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::115849270532:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_key" "aurora_secondary" {
  provider = aws.secondary

  description         = "Secondary region KMS key for Aurora global cluster"
  enable_key_rotation = true

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "secondary"
  })
}

resource "aws_kms_key_policy" "aurora_secondary" {
  provider = aws.secondary
  key_id   = aws_kms_key.aurora_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::115849270532:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.us-east-1.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key" "backup" {
  provider = aws.primary

  description         = "KMS key for AWS Backup vault"
  enable_key_rotation = true

  tags = merge(local.tags, {
    Component = "backup"
    Scope     = "primary"
  })
}

resource "aws_kms_key_policy" "backup" {
  provider = aws.primary
  key_id   = aws_kms_key.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::115849270532:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Backup to use the key"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_backup_vault" "primary" {
  provider = aws.primary

  name        = "${var.project}-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(local.tags, {
    Component = "backup"
  })
}

data "aws_iam_policy_document" "backup_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "backup_role" {
  provider = aws.primary

  name               = "${var.project}-${var.environment}-backup-role"
  assume_role_policy = data.aws_iam_policy_document.backup_assume_role.json

  tags = merge(local.tags, {
    Component = "backup"
  })
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  provider = aws.primary

  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_plan" "primary" {
  provider = aws.primary

  name = "${var.project}-${var.environment}-daily-backup"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 4 * * ? *)"
    completion_window = 120
    start_window      = 60

    lifecycle {
      delete_after = var.db_backup_retention_days
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary.arn
      lifecycle {
        delete_after = var.db_backup_retention_days
      }
    }
  }

  tags = merge(local.tags, {
    Component = "backup"
  })
}

resource "aws_backup_vault" "secondary" {
  provider = aws.secondary

  name = "${var.project}-${var.environment}-backup-vault-secondary"
  kms_key_arn = aws_kms_key.backup_secondary.arn

  tags = merge(local.tags, {
    Component = "backup"
    Scope     = "secondary"
  })
}

resource "aws_kms_key" "backup_secondary" {
  provider = aws.secondary

  description         = "KMS key for AWS Backup vault (secondary)"
  enable_key_rotation = true

  tags = merge(local.tags, {
    Component = "backup"
    Scope     = "secondary"
  })
}

resource "aws_kms_key_policy" "backup_secondary" {
  provider = aws.secondary
  key_id   = aws_kms_key.backup_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::115849270532:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Backup to use the key"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "backup.us-east-1.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_backup_selection" "primary_resources" {
  provider = aws.primary

  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project}-${var.environment}-daily-selection"
  plan_id      = aws_backup_plan.primary.id

  resources = [
    aws_rds_cluster.primary.arn,
    aws_s3_bucket.artifacts_primary.arn
  ]
}

resource "aws_rds_global_cluster" "luneo" {
  provider = aws.primary

  global_cluster_identifier = "${var.project}-${var.environment}-aurora-global"
  engine                    = "aurora-postgresql"
  engine_version            = var.db_engine_version
  storage_encrypted         = true
  deletion_protection       = true
}

resource "aws_rds_cluster" "primary" {
  provider = aws.primary

  cluster_identifier              = "${var.project}-${var.environment}-aurora-primary"
  engine                          = "aurora-postgresql"
  engine_version                  = var.db_engine_version
  global_cluster_identifier       = aws_rds_global_cluster.luneo.id
  database_name                   = var.db_name
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.aurora_primary.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.aurora.arn
  backup_retention_period         = var.db_backup_retention_days
  preferred_backup_window         = var.db_backup_window
  preferred_maintenance_window    = var.db_maintenance_window
  copy_tags_to_snapshot           = true
  apply_immediately               = false
  deletion_protection             = true
  enable_global_write_forwarding  = true
  allow_major_version_upgrade     = false
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.project}-${var.environment}-aurora-primary-final"
  port                            = 5432

  lifecycle {
    ignore_changes = [master_password]
  }

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "primary"
  })
}

resource "aws_rds_cluster_instance" "primary_writer" {
  provider = aws.primary

  identifier         = "${var.project}-${var.environment}-aurora-primary-writer-1"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.db_primary_instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version
  publicly_accessible = false
  promotion_tier     = 1
  availability_zone  = local.primary_azs[0]
  apply_immediately  = false
}

resource "aws_rds_cluster_instance" "primary_reader" {
  provider = aws.primary

  count = var.db_primary_reader_count

  identifier         = "${var.project}-${var.environment}-aurora-primary-reader-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.db_primary_instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version
  publicly_accessible = false
  promotion_tier     = 2
  availability_zone  = element(local.primary_azs, (count.index + 1) % length(local.primary_azs))
  apply_immediately  = false
}

resource "aws_rds_cluster" "secondary" {
  provider = aws.secondary

  cluster_identifier            = "${var.project}-${var.environment}-aurora-secondary"
  engine                        = "aurora-postgresql"
  engine_version                = var.db_engine_version
  global_cluster_identifier     = aws_rds_global_cluster.luneo.id
  db_subnet_group_name          = aws_db_subnet_group.secondary.name
  vpc_security_group_ids        = [aws_security_group.aurora_secondary.id]
  storage_encrypted             = true
  kms_key_id                    = aws_kms_key.aurora_secondary.arn
  replication_source_identifier = aws_rds_cluster.primary.arn
  copy_tags_to_snapshot         = true
  deletion_protection           = true
  enable_global_write_forwarding = false
  skip_final_snapshot           = false
  final_snapshot_identifier     = "${var.project}-${var.environment}-aurora-secondary-final"
  port                          = 5432

  lifecycle {
    ignore_changes = [replication_source_identifier]
  }

  tags = merge(local.tags, {
    Component = "database"
    Scope     = "secondary"
  })
}

resource "aws_rds_cluster_instance" "secondary_reader" {
  provider = aws.secondary

  identifier         = "${var.project}-${var.environment}-aurora-secondary-reader-1"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.db_secondary_instance_class
  engine             = aws_rds_cluster.secondary.engine
  engine_version     = aws_rds_cluster.secondary.engine_version
  publicly_accessible = false
  apply_immediately  = false
  promotion_tier     = 1
  availability_zone  = local.secondary_azs[0]
}

# --- S3 Multi-Region Replication ---
resource "aws_s3_bucket" "artifacts_primary" {
  provider = aws.primary

  bucket        = "${var.project}-${var.environment}-${var.artifact_bucket_suffix}-${var.primary_region}"
  force_destroy = false

  tags = merge(local.tags, {
    Component = "artifacts"
    Scope     = "primary"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts_primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.artifacts_primary.id

  rule {
    id     = "noncurrent-glacier"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    noncurrent_version_transition {
      storage_class = "GLACIER"
      noncurrent_days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_versioning" "artifacts_primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.artifacts_primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts_primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.artifacts_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "artifacts_secondary" {
  provider = aws.secondary

  bucket        = "${var.project}-${var.environment}-${var.artifact_bucket_suffix}-${var.secondary_region}"
  force_destroy = false

  tags = merge(local.tags, {
    Component = "artifacts"
    Scope     = "secondary"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts_secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.artifacts_secondary.id

  rule {
    id     = "noncurrent-glacier-standby"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    noncurrent_version_transition {
      storage_class = "GLACIER"
      noncurrent_days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_versioning" "artifacts_secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.artifacts_secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts_secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.artifacts_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "s3_replication_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "s3_replication" {
  provider = aws.primary

  name               = "${var.project}-${var.environment}-s3-replication-role"
  assume_role_policy = data.aws_iam_policy_document.s3_replication_assume.json

  tags = merge(local.tags, {
    Component = "artifacts"
  })
}

data "aws_iam_policy_document" "s3_replication" {
  statement {
    sid    = "ReplicationSource"
    effect = "Allow"
    actions = [
      "s3:GetReplicationConfiguration",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.artifacts_primary.arn
    ]
  }

  statement {
    sid    = "ReplicationObjects"
    effect = "Allow"
    actions = [
      "s3:GetObjectVersion",
      "s3:GetObjectVersionAcl",
      "s3:GetObjectVersionForReplication",
      "s3:GetObjectVersionTagging",
      "s3:ReplicateObject",
      "s3:ReplicateDelete",
      "s3:ReplicateTags"
    ]
    resources = [
      "${aws_s3_bucket.artifacts_primary.arn}/*",
      "${aws_s3_bucket.artifacts_secondary.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.primary

  name   = "${var.project}-${var.environment}-s3-replication-policy"
  role   = aws_iam_role.s3_replication.id
  policy = data.aws_iam_policy_document.s3_replication.json
}

resource "aws_s3_bucket_replication_configuration" "artifacts" {
  provider = aws.primary

  depends_on = [
    aws_s3_bucket_versioning.artifacts_primary,
    aws_s3_bucket_versioning.artifacts_secondary,
    aws_iam_role_policy.s3_replication
  ]

  bucket = aws_s3_bucket.artifacts_primary.id
  role   = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.artifacts_secondary.arn
      storage_class = "STANDARD"
    }
  }
}

data "aws_caller_identity" "primary" {
  provider = aws.primary
}

data "aws_caller_identity" "secondary" {
  provider = aws.secondary
}

# --- Route53 Failover Records ---
data "aws_route53_zone" "primary" {
  provider = aws.primary
  name     = "app.luneo.app"
}

resource "aws_route53_health_check" "primary" {
  provider = aws.primary

  fqdn              = var.primary_health_check_domain
  port              = var.health_check_port
  type              = "HTTPS"
  resource_path     = var.health_check_path
  request_interval  = 30
  failure_threshold = 3
  regions           = [var.primary_region, var.secondary_region, "us-west-2"]
}

resource "aws_route53_health_check" "secondary" {
  provider = aws.primary

  fqdn              = var.secondary_health_check_domain
  port              = var.health_check_port
  type              = "HTTPS"
  resource_path     = var.health_check_path
  request_interval  = 30
  failure_threshold = 3
  regions           = [var.primary_region, var.secondary_region, "us-west-2"]
}

resource "aws_route53_record" "api_failover_primary" {
  provider = aws.primary
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.api_domain_name
  type    = "CNAME"

  set_identifier = "primary-${var.primary_region}"
  records        = [var.primary_ingress_hostname]
  ttl            = 30

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "api_failover_secondary" {
  provider = aws.primary
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.api_domain_name
  type    = "CNAME"

  set_identifier = "secondary-${var.secondary_region}"
  records        = [var.secondary_ingress_hostname]
  ttl            = 30

  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id
}

# --- CloudWatch Alarms for RPO/RTO ---
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag" {
  provider = aws.primary

  alarm_name          = "${var.project}-${var.environment}-aurora-replication-lag"
  alarm_description   = "Alert when Aurora global cluster replication lag exceeds threshold"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 3
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.db_replication_lag_threshold

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.secondary.id
  }

  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "s3_replication_latency" {
  provider = aws.primary

  alarm_name          = "${var.project}-${var.environment}-s3-replication-latency"
  alarm_description   = "Alert when S3 replication latency exceeds threshold"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "BytesPendingReplication"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Average"
  threshold           = var.s3_replication_pending_threshold

  dimensions = {
    BucketName = aws_s3_bucket.artifacts_primary.bucket
    StorageType = "AllStorageTypes"
  }

  treat_missing_data = "notBreaching"
}

