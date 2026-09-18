import bpy
import math
import os

def build_founder_nexus():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.resolution_x = 800
    scene.render.resolution_y = 800

    # 1. Materials
    # Obsidian Titanium Frame
    mat_obsidian = bpy.data.materials.new(name="ObsidianTitanium")
    mat_obsidian.use_nodes = True
    nodes = mat_obsidian.node_tree.nodes
    links = mat_obsidian.node_tree.links
    nodes.clear()

    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.04, 0.05, 0.08, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.15
    for coat_name in ['Coat Weight', 'Clearcoat']:
        if coat_name in bsdf.inputs:
            bsdf.inputs[coat_name].default_value = 1.0
            break

    output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    # Luminous Cyan Core
    mat_core = bpy.data.materials.new(name="CyanCore")
    mat_core.use_nodes = True
    c_nodes = mat_core.node_tree.nodes
    c_links = mat_core.node_tree.links
    c_nodes.clear()

    emission = c_nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.345, 0.851, 1.0, 1.0)
    emission.inputs['Strength'].default_value = 8.0
    c_output = c_nodes.new(type='ShaderNodeOutputMaterial')
    c_links.new(emission.outputs['Emission'], c_output.inputs['Surface'])

    # 2. Geometry: Sculptural Founder Monolith
    # Hexagonal Beveled Monolith Base
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=1.3, depth=0.35, location=(0, 0, 0))
    hex_base = bpy.context.active_object
    hex_base.data.materials.append(mat_obsidian)
    bevel = hex_base.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.08
    bevel.segments = 4

    # Central Core Floating Gem
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.65, location=(0, 0, 0.2))
    gem = bpy.context.active_object
    gem.rotation_euler = (math.radians(45), math.radians(45), math.radians(30))
    gem.data.materials.append(mat_core)

    # Slender Gyroscope Rings
    bpy.ops.mesh.primitive_torus_add(major_radius=1.65, minor_radius=0.022, location=(0, 0, 0.2))
    ring1 = bpy.context.active_object
    ring1.rotation_euler = (math.radians(55), math.radians(20), 0)
    ring1.data.materials.append(mat_obsidian)

    bpy.ops.mesh.primitive_torus_add(major_radius=1.85, minor_radius=0.018, location=(0, 0, 0.2))
    ring2 = bpy.context.active_object
    ring2.rotation_euler = (math.radians(-40), math.radians(65), math.radians(25))
    ring2.data.materials.append(mat_obsidian)

    # 3. Lighting
    key_light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_light_data.energy = 350
    key_light_data.size = 4.0
    key_light_data.color = (0.95, 0.98, 1.0)
    key_light = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
    scene.collection.objects.link(key_light)
    key_light.location = (-4.0, -4.0, 5.0)
    key_light.rotation_euler = (math.radians(45), 0, math.radians(-45))

    rim_light_data = bpy.data.lights.new(name="RimLight", type='AREA')
    rim_light_data.energy = 550
    rim_light_data.size = 3.0
    rim_light_data.color = (0.345, 0.851, 1.0)
    rim_light = bpy.data.objects.new(name="RimLight", object_data=rim_light_data)
    scene.collection.objects.link(rim_light)
    rim_light.location = (4.5, 4.0, 3.5)
    rim_light.rotation_euler = (math.radians(45), 0, math.radians(135))

    fill_light_data = bpy.data.lights.new(name="FillLight", type='POINT')
    fill_light_data.energy = 150
    fill_light_data.color = (1.0, 0.36, 0.60)
    fill_light = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
    scene.collection.objects.link(fill_light)
    fill_light.location = (0, -3.5, -2.5)

    # 4. Camera (Positioned to frame complete asset)
    cam_data = bpy.data.cameras.new(name="StudioCam")
    cam_data.lens = 75
    cam = bpy.data.objects.new(name="StudioCam", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (6.0, -6.0, 4.8)
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/assets"))
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "founder_nexus_3d.png")
    scene.render.filepath = output_file
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    bpy.ops.render.render(write_still=True)
    print(f"Re-rendered 3D Founder Nexus to {output_file}")

if __name__ == "__main__":
    build_founder_nexus()
