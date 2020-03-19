extern crate js_sys;
extern crate web_sys;

use web_sys::console;

use js_sys::Math::random;

use wasm_bindgen::prelude::*;

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}

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
    return low + ((random() as f32) * (high - low) as f32) as i64;
}

fn max_f(a: f32, b: f32) -> f32 {
    match a > b {
        true => a,
        false => b
    }
}

fn min_f(a: f32, b: f32) -> f32 {
    match a < b {
        true => a,
        false => b
    }
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Pos {
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct Individual {
    incubation_period: u8,
    days_to_recover: u8,
    age: u8,
    is_alive: bool,
    days_infected: f32,
    percent_infected_quarantine_threshold: f32,
    velocity: Pos,
    pub position: Pos,
}

const POPULATION_SIZE: u16 = 500;

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Population {
    pub individual_count: i32,
    // pub ticks: i32,
    pub percent_infected: f32,
    performance_coeff: f32,
    infection_dist: f32,
    individuals: Vec<Individual>,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum IndividualState {
    Dead = 0,
    Uninfected = 1,
    Incubating = 2,
    Symptomatic = 3,
    Recovered = 4
}

#[wasm_bindgen]
impl Individual {
    pub fn state(&mut self) -> IndividualState {
        if !self.is_alive {
            return IndividualState::Dead;
        }

        if self.days_infected == 0.0 {
            return IndividualState::Uninfected;
        }

        if self.days_infected <= self.incubation_period as f32 {
            return IndividualState::Incubating;
        }

        if self.days_infected <= self.days_to_recover as f32 {
            return IndividualState::Symptomatic;
        }

        return IndividualState::Recovered;
    }
}

#[wasm_bindgen]
impl Population {
    pub fn new_with_size(population_size: u32) -> Population {
        let mut individuals = Vec::with_capacity(population_size as usize);

        for i in 0u32..population_size {
            let is_infected: bool = i == 0;
            let days_to_recover: u8;

            if is_infected {
                days_to_recover = 100;
            } else {
                days_to_recover = rand_range(4, 24) as u8
            }

            let age: u8;
            if is_infected {
                age = 18;
            } else {
                age = rand_range(0, 90) as u8
            }

            let mut days_infected = 0.0;

            if is_infected {
                days_infected = 1.0;
            }

            let percent_infected_quarantine_threshold;

            if random() < 0.25 {
                percent_infected_quarantine_threshold = 1.0 - (rand_range(0, 8) as f32 / 10.0);
            } else {
                percent_infected_quarantine_threshold = 1.0 - (rand_range(0, 5) as f32 / 10.0);
            }

            let individual: Individual = Individual {
                incubation_period: rand_range(4, 20) as u8,
                days_to_recover,
                age,
                is_alive: true,
                days_infected,
                percent_infected_quarantine_threshold,
                position: Pos { x: random() as f32, y: random() as f32 },
                velocity: Pos {
                    x: rand_range(-10, 20) as f32 / 100f32,
                    y: rand_range(-10, 20) as f32 / 100f32,
                },
            };
            individuals.push(individual);
        }

        let performance_coeff = (population_size as f32).powf(-0.1);
        let infection_dist = (population_size as f32).powf(-0.515);

        Population {
            individuals,
            individual_count: population_size as i32,
            performance_coeff,
            infection_dist,
            // ticks: 0,
            percent_infected: 0.0,
        }
    }

    pub fn new() -> Population {
        Population::new_with_size(POPULATION_SIZE as u32)
    }

    pub fn first_n(&mut self, n: i32) -> Population {
        let mut new_individuals: Vec<Individual> = Vec::with_capacity(n as usize);

        for i in 0..n {
            new_individuals.push(self.individuals[i as usize]);
        }

        Population {
            individuals: new_individuals,
            individual_count: n,
            // ticks: self.ticks,
            // Not completely accurate but should update on the next tick
            percent_infected: self.percent_infected,
            performance_coeff: self.performance_coeff,
            infection_dist: self.infection_dist,
        }
    }

    pub fn tick(&mut self, delta: f32) {
        // let _timer = Timer::new("Population::tick");
        let percent_second: f32 = delta / 1000.0;

        let move_probability = 0.01 * (1.0 - self.percent_infected.powf(1.0 / 5.0));
        let last_percent_infected: f32 = self.percent_infected;

        let mut total_infected: i32 = 0;

        let velocity_mag_coeff = 0.05 * (1.0 - (last_percent_infected * 0.75));
        let velocity_friction_coeff = (1.0 - (0.5 * percent_second)) as f32;

        for i in 0..self.individual_count {
            let mut individual = self.individual_at_index(i);

            if individual.is_alive {

                let showing_symptoms =
                    individual.days_infected > individual.incubation_period as f32 &&
                        individual.days_infected < individual.days_to_recover as f32;

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
                    // Leave some probability that an individual will move even in quarantine
                    (last_percent_infected < individual.percent_infected_quarantine_threshold ||
                        random() < 0.05)
                {
                    individual.velocity.x +=
                        ((random() as f32 * 2.0) - 1.0) * velocity_mag_coeff;
                    individual.velocity.y +=
                        ((random() as f32 * 2.0) - 1.0) * velocity_mag_coeff;
                }
            }

            if individual.days_infected > 0.0 {
                total_infected += 1;
                individual.days_infected += percent_second;

                if individual.days_infected < individual.days_to_recover as f32 {
                    if individual.age > 60 {
                        if (random() as f32) < (0.02 / individual.days_to_recover as f32) {
                            individual.is_alive = false
                        }
                    } else {
                        if (random() as f32) < (0.001 / individual.days_to_recover as f32) {
                            individual.is_alive = false
                        }
                    }
                }
            }

            // Make costly distance calculations increasingly less as n increases to increase
            // performance
            if (random() as f32) < self.performance_coeff {
                for j in 0..self.individual_count {
                    if i == j {
                        continue;
                    }
                    let other_individual = self.individuals[j as usize];

                    if other_individual.days_infected == 0.0 ||
                        other_individual.days_infected > other_individual.days_to_recover as f32 ||
                        !other_individual.is_alive {
                        continue;
                    }

                    let dist_x = individual.position.x - other_individual.position.x;
                    let dist_y = individual.position.y - other_individual.position.y;

                    if dist_x.abs() > self.infection_dist || dist_y.abs() > self.infection_dist {
                        continue;
                    }

                    let dist = (dist_x.powi(2) + dist_y.powi(2)).sqrt();

                    // NOTE: Remove this if it is determined to be a performance burden
                    if individual.days_infected < individual.incubation_period as f32 &&
                        other_individual.days_infected > other_individual.incubation_period as f32 &&
                        /* last_percent_infected < individual.percent_infected_quarantine_threshold *&&*/
                        dist < 1.0 {
                        // http://exploratoria.github.io/exhibits/astronomy/gravitating-system/
                        // 100 is our minimum distance so things don't get too crazy

                        let d2 = max_f(dist.powi(2), 0.0001);
                        let magnitude = 6.67e-11 / d2 / d2.sqrt();

                        individual.velocity.x += magnitude * dist_x * 5000.0;
                        individual.velocity.y += magnitude * dist_y * 5000.0;
                    }

                    if individual.days_infected > 0.0 {
                        continue;
                    }

                    if dist < self.infection_dist && random() < 0.25 {
                        individual.days_infected = 1.0;
                    }
                }
            }

            individual.velocity.x *= velocity_friction_coeff;
            individual.velocity.y *= velocity_friction_coeff;

            // individual.velocity.x = max_f(-1.0, min_f(1.0, individual.velocity.x));
            // individual.velocity.y = max_f(-1.0, min_f(1.0, individual.velocity.y));
            self.individuals[i as usize] = individual;
        }

        self.percent_infected = total_infected as f32 / self.individual_count as f32;
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

