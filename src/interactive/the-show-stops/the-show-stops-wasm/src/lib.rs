extern crate js_sys;

use js_sys::Math::random;

use wasm_bindgen::prelude::*;
// use std::cmp::{max, min};


// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();
    // alert("yes!");
}

pub fn rand_range(low: i64, high: i64) -> i64 {
    return low + (random() * (high - low) as f64) as i64;
}

fn max_f(a: f64, b: f64) -> f64 {
    match a > b {
        true => a,
        false => b
    }
}

fn min_f(a: f64, b: f64) -> f64 {
    match a < b {
        true => a,
        false => b
    }
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Pos {
    pub x: f64,
    pub y: f64,
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Individual {
    pub incubation_period: i32,
    pub days_to_recover: i32,
    pub age: i32,
    pub is_alive: bool,
    pub days_infected: f64,
    pub percent_infected_quarantine_threshold: f64,
    pub position: Pos,
    pub velocity: Pos,
}

const POPULATION_SIZE: i16 = 500;

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Population {
    individuals: Vec<Individual>,
    pub individual_count: i32,
    pub ticks: i32,
    pub percent_infected: f64,
}

#[wasm_bindgen]
impl Population {
    pub fn new_with_size(population_size: i32) -> Population {
        let mut individuals: Vec<Individual> = Vec::new();

        for i in 0i32..population_size as i32 {
            let is_infected: bool = i == 0;
            let days_to_recover: i32;

            if is_infected {
                days_to_recover = 100;
            } else {
                days_to_recover = rand_range(4, 24) as i32
            }

            let age: i32;
            if is_infected {
                age = 18;
            } else {
                age = rand_range(0, 90) as i32
            }

            let mut days_infected = 0.0;

            if is_infected {
                days_infected = 1.0;
            }

            let percent_infected_quarantine_threshold;

            if random() < 0.25 {
                percent_infected_quarantine_threshold = 1.0 - (rand_range(0, 8) as f64 / 10.0);
            } else {
                percent_infected_quarantine_threshold = 1.0 - (rand_range(0, 5) as f64 / 10.0);
            }

            let individual: Individual = Individual {
                incubation_period: rand_range(4, 20) as i32,
                days_to_recover,
                age,
                is_alive: true,
                days_infected,
                percent_infected_quarantine_threshold,
                position: Pos { x: random(), y: random() },
                velocity: Pos {
                    x: rand_range(-10, 20) as f64 / 100f64,
                    y: rand_range(-10, 20) as f64 / 100f64,
                },
            };
            individuals.push(individual);
        }

        Population {
            individuals,
            individual_count: population_size as i32,
            ticks: 0,
            percent_infected: 0.0,
        }
    }

    pub fn new() -> Population {
        Population::new_with_size(POPULATION_SIZE as i32)
    }

    pub fn first_n(&mut self, n: i32) -> Population {
        let mut new_individuals: Vec<Individual> = Vec::new();

        for i in 0..n {
            new_individuals.push(self.individuals[i as usize]);
        }

        Population {
            individuals: new_individuals,
            individual_count: n,
            ticks: self.ticks,
            // Not completely accurate but should update on the next tick
            percent_infected: self.percent_infected,
        }
    }

    pub fn tick(&mut self, delta: f64) {
        let percent_second: f64 = delta / 1000.0;
        let last_percent_infected: f64 = self.percent_infected;
        let mut total_infected: i32 = 0;
        let performance_coeff = (self.individual_count as f64).powf(-0.1);

        let infection_dist = (self.individual_count as f64).powf(-0.515);
        let move_probability = 0.01 * (1.0 - self.percent_infected.powf(1.0 / 5.0));

        let velocity_mag_coeff = 0.05 * (1.0 - (last_percent_infected * 0.75));
        let velocity_friction_coeff = (1.0 - (0.5 * percent_second)) as f64;


        for i in 0..self.individual_count {
            let mut individual = self.individual_at_index(i);
            let showing_symptoms =
                individual.days_infected > individual.incubation_period as f64 &&
                    individual.days_infected < individual.days_to_recover as f64;

            if individual.is_alive {
                individual.position.x += individual.velocity.x * percent_second;
                individual.position.y += individual.velocity.y * percent_second;

                if individual.position.x > 1.0 {
                    individual.position.x = 0.0
                }

                if individual.position.x < 0.0 {
                    individual.position.x = 1.0
                }

                if individual.position.y > 1.0 {
                    individual.position.y = 0.0
                }

                if individual.position.y < 0.0 {
                    individual.position.y = 1.0
                }

                if random() < move_probability as f64 &&
                    !showing_symptoms &&
                    (last_percent_infected < individual.percent_infected_quarantine_threshold || random() < 0.01)
                {
                    individual.velocity.x +=
                        ((random() * 2.0) - 1.0) * velocity_mag_coeff;
                    individual.velocity.y +=
                        ((random() * 2.0) - 1.0) * velocity_mag_coeff;
                }
            }

            if individual.days_infected > 0.0 {
                total_infected += 1;
                individual.days_infected += percent_second;

                if individual.days_infected < individual.days_to_recover as f64 {
                    if individual.age > 60 {
                        if random() < 0.02 / individual.days_to_recover as f64 {
                            individual.is_alive = false
                        }
                    } else {
                        if random() < 0.001 / individual.days_to_recover as f64 {
                            individual.is_alive = false
                        }
                    }
                }
            }

            // Make costly distance calculations increasingly less as n increases to increase
            // performance
            if random() < performance_coeff {
                for j in 0..self.individual_count {
                    if i == j {
                        continue;
                    }
                    let other_individual = self.individuals[j as usize];
                    if other_individual.days_infected == 0.0 ||
                        other_individual.days_infected > other_individual.days_to_recover as f64 ||
                        !other_individual.is_alive {
                        continue;
                    }
                    let dist_x = individual.position.x - other_individual.position.x;
                    let dist_y = individual.position.y - other_individual.position.y;
                    let dist = (dist_x.powi(2) + dist_y.powi(2)).sqrt();

                    // NOTE: Skip gravity calculation for now
                    // if individual.days_infected < individual.incubation_period as f64 &&
                    //     other_individual.days_infected > other_individual.incubation_period as f64 &&
                    //     last_percent_infected < individual.percent_infected_quarantine_threshold &&
                    //     dist < 0.01 {
                    //     // http://exploratoria.github.io/exhibits/astronomy/gravitating-system/
                    //     // 100 is our minimum distance so things don't get too crazy
                    //
                    //     let d2 = max_f(dist.powi(2), 0.001);
                    //     let magnitude = 6.67e-11 / d2 / d2.sqrt();
                    //
                    //     individual.velocity.x += magnitude * dist_x * 1000.0;
                    //     individual.velocity.y += magnitude * dist_y * 1000.0;
                    // }

                    if individual.days_infected > 0.0 {
                        continue;
                    }

                    if dist < infection_dist && random() < 0.8 {
                        individual.days_infected = 1.0;
                        // break;
                    }
                }
            }

            individual.velocity.x *= velocity_friction_coeff;
            individual.velocity.y *= velocity_friction_coeff;

            // individual.velocity.x = max_f(-1.0, min_f(1.0, individual.velocity.x));
            // individual.velocity.y = max_f(-1.0, min_f(1.0, individual.velocity.y));
            self.individuals[i as usize] = individual;
        }

        self.percent_infected = total_infected as f64 / self.individual_count as f64;
    }

    pub fn individual_at_index(&mut self, i: i32) -> Individual {
        return self.individuals[i as usize];
    }
}


// #[wasm_bindgen]
// pub fn greet() -> String {
//     return "Hello, the-show-stops-wasm-wasm!";
// }
//

