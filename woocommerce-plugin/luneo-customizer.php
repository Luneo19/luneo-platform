<?php
/**
 * Plugin Name: Luneo Product Customizer
 * Plugin URI: https://luneo.app
 * Description: Add product customization to your WooCommerce store with Luneo
 * Version: 1.0.0
 * Author: Luneo
 * Author URI: https://luneo.app
 * Text Domain: luneo-customizer
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 * WC tested up to: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class Luneo_Product_Customizer {
    private $api_key;
    private $app_url = 'https://app.luneo.app';

    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('woocommerce_before_add_to_cart_button', [$this, 'add_customize_button']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_filter('woocommerce_add_cart_item_data', [$this, 'add_custom_design_to_cart'], 10, 2);
        add_filter('woocommerce_get_item_data', [$this, 'display_custom_design_in_cart'], 10, 2);
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'save_custom_design_to_order'], 10, 4);
    }

    public function add_admin_menu() {
        add_options_page(
            'Luneo Customizer Settings',
            'Luneo Customizer',
            'manage_options',
            'luneo-customizer',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('luneo_customizer_settings', 'luneo_api_key');
        register_setting('luneo_customizer_settings', 'luneo_button_text');
        register_setting('luneo_customizer_settings', 'luneo_button_style');
        register_setting('luneo_customizer_settings', 'luneo_enabled_products');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Luneo Product Customizer Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('luneo_customizer_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="luneo_api_key">API Key</label></th>
                        <td>
                            <input type="text" id="luneo_api_key" name="luneo_api_key" 
                                   value="<?php echo esc_attr(get_option('luneo_api_key')); ?>" 
                                   class="regular-text" />
                            <p class="description">Get your API key from <a href="https://app.luneo.app/settings" target="_blank">Luneo Dashboard</a></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="luneo_button_text">Button Text</label></th>
                        <td>
                            <input type="text" id="luneo_button_text" name="luneo_button_text" 
                                   value="<?php echo esc_attr(get_option('luneo_button_text', 'Customize')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="luneo_button_style">Button Style</label></th>
                        <td>
                            <select id="luneo_button_style" name="luneo_button_style">
                                <option value="primary" <?php selected(get_option('luneo_button_style', 'primary'), 'primary'); ?>>Primary</option>
                                <option value="secondary" <?php selected(get_option('luneo_button_style'), 'secondary'); ?>>Secondary</option>
                                <option value="outline" <?php selected(get_option('luneo_button_style'), 'outline'); ?>>Outline</option>
                            </select>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_scripts() {
        if (is_product()) {
            wp_enqueue_script(
                'luneo-widget',
                plugins_url('js/luneo-widget.js', __FILE__),
                ['jquery'],
                '1.0.0',
                true
            );

            wp_localize_script('luneo-widget', 'luneoConfig', [
                'apiKey' => get_option('luneo_api_key'),
                'appUrl' => $this->app_url,
                'buttonText' => get_option('luneo_button_text', 'Customize'),
                'buttonStyle' => get_option('luneo_button_style', 'primary'),
            ]);
        }
    }

    public function add_customize_button() {
        global $product;
        
        if (!$product) return;

        $api_key = get_option('luneo_api_key');
        if (!$api_key) return;

        $product_id = $product->get_id();
        $button_text = get_option('luneo_button_text', 'Customize');
        $button_style = get_option('luneo_button_style', 'primary');

        ?>
        <button type="button" 
                class="luneo-customize-btn button alt <?php echo esc_attr($button_style); ?>"
                data-product-id="<?php echo esc_attr($product_id); ?>"
                data-luneo-customize>
            <?php echo esc_html($button_text); ?>
        </button>
        <?php
    }

    public function add_custom_design_to_cart($cart_item_data, $product_id) {
        if (isset($_POST['luneo_design_id'])) {
            $cart_item_data['luneo_design_id'] = sanitize_text_field($_POST['luneo_design_id']);
            $cart_item_data['luneo_preview_url'] = esc_url_raw($_POST['luneo_preview_url']);
            $cart_item_data['luneo_print_ready_url'] = esc_url_raw($_POST['luneo_print_ready_url']);
            $cart_item_data['unique_key'] = md5(microtime() . rand());
        }
        return $cart_item_data;
    }

    public function display_custom_design_in_cart($item_data, $cart_item) {
        if (isset($cart_item['luneo_design_id'])) {
            $item_data[] = [
                'name' => __('Custom Design', 'luneo-customizer'),
                'value' => '<a href="' . esc_url($cart_item['luneo_preview_url']) . '" target="_blank">View Design</a>',
            ];
        }
        return $item_data;
    }

    public function save_custom_design_to_order($item, $cart_item_key, $values, $order) {
        if (isset($values['luneo_design_id'])) {
            $item->add_meta_data('_luneo_design_id', $values['luneo_design_id'], true);
            $item->add_meta_data('_luneo_preview_url', $values['luneo_preview_url'], true);
            $item->add_meta_data('_luneo_print_ready_url', $values['luneo_print_ready_url'], true);
        }
    }
}

// Initialize plugin
new Luneo_Product_Customizer();

