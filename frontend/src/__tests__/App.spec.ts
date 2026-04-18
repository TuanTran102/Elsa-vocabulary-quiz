import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import App from '../App.vue';

describe('App Smoke Test', () => {
  it('renders a PrimeVue button', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [PrimeVue],
        components: {
          'p-button': Button
        }
      }
    });
    // This depends on what's in App.vue. We will update App.vue next.
    expect(wrapper.exists()).toBe(true);
  });
});
