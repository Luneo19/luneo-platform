project                      = "luneo"
environment                  = "prod"
primary_region               = "eu-west-1"
secondary_region             = "us-east-1"
primary_ingress_hostname     = "k8s-luneo-prod-1234567890.eu-west-1.elb.amazonaws.com"
secondary_ingress_hostname   = "k8s-luneo-prod-0987654321.us-east-1.elb.amazonaws.com"
api_domain_name              = "api.luneo.app"
route53_zone_id              = "Z03255521WIUL2ASUN37A"
primary_health_check_domain  = "api.luneo.app"
secondary_health_check_domain = "api-secondary.luneo.app"
db_master_password           = "Emmanuel.abougadous1997"
create_kubernetes_resources  = true

# Optionnel : ajuster la capacité des node groups
# eks_primary_min_size  = 4
# eks_primary_max_size  = 10
# eks_primary_instance_types = ["m6i.large", "m6i.xlarge"]

